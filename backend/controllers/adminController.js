﻿﻿import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import SupportRequest from '../models/supportRequestModel.js';
import Notification from '../models/Notification.js';
import { cloudinary } from '../config/cloudinary.js';
import { deleteLocalImage } from '../utils/localUpload.js';

const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const toMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const getAdminStats = asyncHandler(async (_req, res) => {
  const [totalUsers, totalHosts, totalBookings, totalProperties] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'host' }),
    Booking.countDocuments(),
    Property.countDocuments(),
  ]);

  const revenueAgg = await Booking.aggregate([
    { $match: { status: { $in: ['confirmed', 'completed'] } } },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $convert: {
              input: '$totalPrice',
              to: 'double',
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
    },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  const fiveMonthsAgo = new Date();
  fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);

  const [bookingRows, userRows] = await Promise.all([
    Booking.find({ createdAt: { $gte: fiveMonthsAgo } })
      .select('createdAt totalPrice status')
      .lean(),
    User.find({ createdAt: { $gte: fiveMonthsAgo } })
      .select('createdAt')
      .lean(),
  ]);

  const monthlyMap = new Map();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = toMonthKey(d);
    monthlyMap.set(key, { month: key, revenue: 0, bookings: 0, users: 0 });
  }

  bookingRows.forEach((b) => {
    const key = toMonthKey(new Date(b.createdAt));
    if (!monthlyMap.has(key)) return;
    const row = monthlyMap.get(key);
    row.bookings += 1;
    if (['confirmed', 'completed'].includes(b.status)) {
      const price = typeof b.totalPrice === 'string' ? parseFloat(b.totalPrice.replace(/[^0-9.]/g, '')) : Number(b.totalPrice || 0);
      row.revenue += isNaN(price) ? 0 : price;
    }
    monthlyMap.set(key, row);
  });

  userRows.forEach((u) => {
    const key = toMonthKey(new Date(u.createdAt));
    if (!monthlyMap.has(key)) return;
    const row = monthlyMap.get(key);
    row.users += 1;
    monthlyMap.set(key, row);
  });

  const topCities = await Property.aggregate([
    { $group: { _id: '$location.city', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const topProperties = await Booking.aggregate([
    {
      $group: {
        _id: '$listing',
        bookings: { $sum: 1 },
        revenue: {
          $sum: {
            $convert: {
              input: '$totalPrice',
              to: 'double',
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
    },
    { $sort: { bookings: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'properties',
        localField: '_id',
        foreignField: '_id',
        as: 'listing',
      },
    },
    { $unwind: { path: '$listing', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        title: '$listing.title',
        city: '$listing.location.city',
        bookings: 1,
        revenue: 1,
      },
    },
  ]);

  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(4).select('name email createdAt role').lean();
  const recentBookings = await Booking.find().sort({ createdAt: -1 }).limit(4).populate('user', 'name').populate('listing', 'title').lean();

  const recentActivity = [
    ...recentUsers.map((u) => ({
      id: `user-${u._id}`,
      type: 'user',
      text: `${u.name || 'User'} joined as ${u.role}`,
      at: u.createdAt,
    })),
    ...recentBookings.map((b) => ({
      id: `booking-${b._id}`,
      type: 'booking',
      text: `${b.user?.name || 'User'} booked ${b.listing?.title || 'a listing'}`,
      at: b.createdAt,
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);

  res.json({
    totals: { totalUsers, totalHosts, totalBookings, totalProperties, totalRevenue },
    charts: Array.from(monthlyMap.values()),
    topCities: topCities.map((c) => ({ city: c._id || 'Unknown', count: c.count })),
    topProperties,
    recentActivity,
  });
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const { q = '', role = 'all' } = req.query;
  const filter = {};
  if (role !== 'all') filter.role = role;
  if (q) {
    const safe = escapeRegex(String(q).trim());
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ];
  }

  const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
  res.json(users);
});

export const updateUserAdmin = asyncHandler(async (req, res) => {
  const { role, isBanned } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent any admin (not just self) from demoting or modifying another admin's role.
  // Only the admin's own role/ban status can be changed by themselves in specific ways below.
  if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
    res.status(403);
    throw new Error('Cannot modify another admin account');
  }

  if (typeof isBanned === 'boolean') {
    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Admin accounts cannot be banned');
    }
    user.isBanned = isBanned;
  }

  if (user._id.toString() === req.user._id.toString() && role && role !== 'admin') {
    res.status(400);
    throw new Error('You cannot remove your own admin role');
  }

  if (role && ['guest', 'host', 'admin', 'user'].includes(role)) {
    // Prevent granting admin role through this generic endpoint to avoid
    // accidental privilege escalation; that should be a deliberate, separate action.
    if (role === 'admin' && user.role !== 'admin') {
      res.status(403);
      throw new Error('Promoting a user to admin is not supported via this endpoint');
    }
    user.role = role;
  }

  await user.save();
  res.json({ success: true, user });
});

export const deleteUserAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot delete another admin');
  }

  await user.deleteOne();
  res.json({ success: true });
});

export const getAdminListings = asyncHandler(async (req, res) => {
  const { status = 'all', q = '' } = req.query;
  const filter = {};
  if (status !== 'all') filter.status = status;
  if (q) {
    const safe = escapeRegex(String(q).trim());
    filter.$or = [
      { title: { $regex: safe, $options: 'i' } },
      { 'location.city': { $regex: safe, $options: 'i' } },
    ];
  }

  const listings = await Property.find(filter).populate('host', 'name email role').sort({ createdAt: -1 });
  res.json(listings);
});

export const updateListingAdmin = asyncHandler(async (req, res) => {
  const { status, rejectionReason = '' } = req.body;
  const listing = await Property.findById(req.params.id);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    listing.status = status;
    listing.rejectionReason = status === 'rejected' ? rejectionReason : '';
  }

  await listing.save();
  res.json({ success: true, listing });
});

export const deleteListingAdmin = asyncHandler(async (req, res) => {
  const listing = await Property.findById(req.params.id);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  const hasBookings = await Booking.exists({ listing: listing._id });
  if (hasBookings) {
    res.status(409);
    throw new Error('Cannot delete a property with existing bookings');
  }

  for (const imageUrl of listing.images || []) {
    try {
      if (imageUrl.includes('res.cloudinary.com')) {
        const parts = imageUrl.split('/');
        const fileName = parts[parts.length - 1].split('.')[0];
        const folder = parts[parts.length - 2];
        await cloudinary.uploader.destroy(`${folder}/${fileName}`);
      } else {
        await deleteLocalImage(imageUrl);
      }
    } catch {
      // Keep admin deletion resilient if an image cleanup fails.
    }
  }

  await listing.deleteOne();
  res.json({ success: true });
});

// @desc    Get paginated bookings for admin, with optional search & status filter
// @route   GET /api/admin/bookings
export const getAdminBookings = asyncHandler(async (req, res) => {
  const { q = '', status = 'all' } = req.query;
  const filter = {};
  if (status !== 'all') filter.status = status;

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  if (q) {
    // Free-text search spans fields across two collections (user name/email, listing
    // title), which Mongo can't filter directly at the query level without a lookup
    // pipeline. We use an aggregation so pagination happens *after* filtering,
    // instead of loading every matching document into memory first.
    const qRegex = new RegExp(escapeRegex(String(q).trim()), 'i');

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'properties',
          localField: 'listing',
          foreignField: '_id',
          as: 'listing',
        },
      },
      { $unwind: { path: '$listing', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { 'user.name': qRegex },
            { 'user.email': qRegex },
            { 'listing.title': qRegex },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const result = await Booking.aggregate(pipeline);
    const bookings = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    return res.json({
      bookings,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('user', 'name email')
      .populate('listing', 'title location.city price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  res.json({
    bookings,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

export const updateBookingAdmin = asyncHandler(async (req, res) => {
  const { status, refundAmount = 0 } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (status !== undefined && !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    res.status(400);
    throw new Error('Invalid booking status');
  }

  if (status !== undefined) booking.status = status;

  const parsedRefund = Number(refundAmount);
  if (refundAmount !== undefined && (!Number.isFinite(parsedRefund) || parsedRefund < 0)) {
    res.status(400);
    throw new Error('Invalid refund amount');
  }

  if (parsedRefund > Number(booking.totalPrice || 0)) {
    res.status(400);
    throw new Error('Refund cannot exceed booking total');
  }

  if (status === 'cancelled') {
    const effectiveRefundAmount = parsedRefund > 0
      ? parsedRefund
      : (booking.paymentMethod === 'paypal' && booking.paymentStatus === 'paid' ? Number(booking.totalPrice || 0) : 0);

    if (effectiveRefundAmount > 0) {
      booking.refundAmount = effectiveRefundAmount;
      booking.refundedAt = new Date();
      booking.paymentStatus = 'refunded';
    }
  }

  await booking.save();
  res.json({ success: true, booking });
});

export const getAdminMessages = asyncHandler(async (req, res) => {
  const { type = 'all' } = req.query;
  const filter = {};
  if (type !== 'all') filter.type = type;
  const rows = await SupportRequest.find(filter).sort({ createdAt: -1 });
  res.json(rows);
});

export const updateAdminMessage = asyncHandler(async (req, res) => {
  const { adminReply = '', status } = req.body;
  const request = await SupportRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Message not found');
  }

  if (typeof adminReply === 'string' && adminReply.length > 3000) {
    res.status(400);
    throw new Error('Reply too long');
  }

  if (typeof adminReply === 'string') request.adminReply = adminReply.trim();
  if (status && ['pending', 'approved', 'rejected', 'resolved'].includes(status)) request.status = status;
  if (status === 'resolved') {
    request.resolvedAt = new Date();
    request.resolvedBy = req.user._id;
  }

  await request.save();
  res.json({ success: true, request });
});

export const deleteAdminMessage = asyncHandler(async (req, res) => {
  await SupportRequest.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export const updateHostRequest = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const request = await SupportRequest.findById(req.params.id);
  if (!request || request.type !== 'host-upgrade') {
    res.status(404);
    throw new Error('Host request not found');
  }

  request.status = status === 'approved' ? 'approved' : 'rejected';
  await request.save();

  if (request.userId && status === 'approved') {
    await User.findByIdAndUpdate(request.userId, { role: 'host' });
  }

  res.json({ success: true, request });
});

export const sendAdminNotification = asyncHandler(async (req, res) => {
  const { audience = 'all', message } = req.body;
  if (!message || !String(message).trim()) {
    res.status(400);
    throw new Error('Message is required');
  }

  if (message.length > 1000) {
    res.status(400);
    throw new Error('Message too long');
  }

  const audienceFilterMap = {
    hosts: { role: 'host' },
    // "Guests" in this app's terminology means regular users who book stays
    // (role: 'user'), as opposed to hosts who list properties.
    guests: { role: 'user' },
    all: {},
  };

  const userFilter = audienceFilterMap[audience] ?? {};
  const users = await User.find(userFilter).select('_id');

  if (!users.length) return res.json({ success: true, sent: 0 });

  await Notification.insertMany(
    users.map((u) => ({
      recipientId: String(u._id),
      senderName: 'Admin',
      message: String(message).trim(),
    })),
    { ordered: false }
  );

  res.json({ success: true, sent: users.length });
});