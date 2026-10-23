import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';

const recalcPropertyRating = async (listingId) => {
  const stats = await Review.aggregate([
    { $match: { listingId: new mongoose.Types.ObjectId(listingId) } },
    {
      $group: {
        _id: '$listingId',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const avgRating = stats[0]?.avgRating || 0;
  const count = stats[0]?.count || 0;

  await Property.findByIdAndUpdate(listingId, {
    rating: Math.round(avgRating * 10) / 10,
    numReviews: count,
  });
};

// @desc    Create a review for a listing
// @route   POST /api/reviews
// @access  Private
export const createReview = asyncHandler(async (req, res) => {
  const { listingId, rating, comment } = req.body;

  if (!listingId || !mongoose.Types.ObjectId.isValid(listingId)) {
    res.status(400);
    throw new Error('Invalid listing id');
  }

  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    res.status(400);
    throw new Error('Rating must be an integer between 1 and 5');
  }

  const trimmedComment = String(comment || '').trim();
  if (!trimmedComment) {
    res.status(400);
    throw new Error('Comment is required');
  }
  if (trimmedComment.length > 1000) {
    res.status(400);
    throw new Error('Comment is too long');
  }

  const listing = await Property.findById(listingId);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  // Only guests with a confirmed or completed booking for this listing can review it.
  // This prevents fake/spam reviews from users who never actually booked.
  const eligibleBooking = await Booking.findOne({
    listing: listingId,
    user: req.user._id,
    status: { $in: ['confirmed', 'completed'] },
  });

  if (!eligibleBooking) {
    res.status(403);
    throw new Error('You can only review properties you have booked');
  }

  const existingReview = await Review.findOne({ listingId, userId: req.user._id });
  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this property');
  }

  const review = await Review.create({
    listingId,
    userId: req.user._id,
    userName: req.user.name,
    userImage: req.user.image || '',
    rating: numericRating,
    comment: trimmedComment,
  });

  await recalcPropertyRating(listingId);

  res.status(201).json(review);
});

// @desc    Get reviews for a listing (paginated)
// @route   GET /api/reviews/listing/:listingId
// @access  Public
export const getReviewsByListing = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.listingId)) {
    res.status(400);
    throw new Error('Invalid listing id');
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const [reviews, total] = await Promise.all([
    Review.find({ listingId: req.params.listingId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments({ listingId: req.params.listingId }),
  ]);

  res.json({
    reviews,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

// @desc    Host replies to a review on their listing
// @route   PUT /api/reviews/:id/reply
// @access  Private (listing host or admin)
export const replyToReview = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid review id');
  }

  const trimmedReply = String(req.body.hostReply || '').trim();

  if (!trimmedReply) {
    res.status(400);
    throw new Error('Reply text is required');
  }

  if (trimmedReply.length > 1000) {
    res.status(400);
    throw new Error('Reply is too long');
  }

  const review = await Review.findById(req.params.id).populate('listingId', 'host');
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const listingHostId = review.listingId?.host;
  const isHostOwner = listingHostId && listingHostId.toString() === req.user._id.toString();

  if (!isHostOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to reply to this review');
  }

  review.hostReply = trimmedReply;
  await review.save();

  res.json(review);
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (review owner or admin)
export const deleteReview = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid review id');
  }

  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  const { listingId } = review;
  await review.deleteOne();
  await recalcPropertyRating(listingId);

  res.json({ message: 'Review deleted successfully' });
});