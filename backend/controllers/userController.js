import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';

const serializeWishlist = (wishlist = []) =>
  wishlist.map((item) => ({
    _id: item.listingId,
    title: item.title,
    price: item.price,
    rating: item.rating,
    image: item.image,
    city: item.city,
    source: item.source,
  }));

const findWishlistSource = async (listingId) => {
  const property = await Property.findById(listingId).select('title price rating images location');
  if (property) {
    return {
      listingId: String(property._id),
      source: 'property',
      title: property.title,
      price: property.price,
      rating: property.rating || 0,
      image: property.images?.[0] || '',
      city: property.location?.city || 'Morocco',
    };
  }

  return null;
};

// NOTE: Profile updates (name, email, password, bio, image) are handled exclusively
// by authController.js -> updateUserProfile (route: PUT/PATCH /api/auth/profile).
// This avoids having two endpoints with divergent validation rules for the same action.
// If you need a /api/users/profile alias, point it to authController's handler instead
// of duplicating logic here.

// @desc    Delete user account and related data
// @route   DELETE /api/users/profile
// @access  Private
export const deleteUserAccount = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const properties = await Property.find({ host: user._id }).select('_id');
  const propertyIds = properties.map((p) => p._id);

  await Booking.deleteMany({ listing: { $in: propertyIds } });
  await Property.deleteMany({ host: user._id });
  await Booking.deleteMany({ user: user._id });
  await user.deleteOne();

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.json({ message: 'تم حذف الحساب وجميع البيانات المرتبطة بنجاح' });
});

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('wishlist');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(serializeWishlist(user.wishlist));
});

// @desc    Add item to wishlist
// @route   POST /api/users/wishlist
// @access  Private
export const addWishlistItem = asyncHandler(async (req, res) => {
  const { listingId } = req.body;

  if (!listingId) {
    res.status(400);
    throw new Error('listingId is required');
  }

  if (!mongoose.Types.ObjectId.isValid(listingId)) {
    res.status(400);
    throw new Error('Invalid listing id');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const exists = user.wishlist.some((item) => item.listingId === String(listingId));

  if (!exists) {
    const wishlistItem = await findWishlistSource(listingId);
    if (!wishlistItem) {
      res.status(404);
      throw new Error('Listing not found');
    }

    user.wishlist.unshift(wishlistItem);
    await user.save();
  }

  res.status(201).json(serializeWishlist(user.wishlist));
});

// @desc    Remove item from wishlist
// @route   DELETE /api/users/wishlist/:listingId
// @access  Private
export const removeWishlistItem = asyncHandler(async (req, res) => {
  const { listingId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(listingId)) {
    res.status(400);
    throw new Error('Invalid listing id');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.wishlist = user.wishlist.filter((item) => item.listingId !== String(listingId));
  await user.save();

  res.json(serializeWishlist(user.wishlist));
});