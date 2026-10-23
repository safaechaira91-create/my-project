import Notification from '../models/Notification.js';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';

// @desc    Get Notifications for authenticated user (paginated)
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const [notifications, total] = await Promise.all([
    Notification.find({ recipientId: String(req.user._id) })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ recipientId: String(req.user._id) }),
  ]);

  res.json({
    notifications,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

// @desc    Get unread notifications count (lightweight, for badge display)
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadNotificationsCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipientId: String(req.user._id),
    read: false,
  });

  res.json({ count });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid notification id');
  }

  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      recipientId: String(req.user._id),
    },
    {
      read: true,
    },
    { new: true }
  );

  if (!notification) {
    // Could be "not found" or "not owned by this user" - same response either way
    // to avoid leaking existence of other users' notifications.
    res.status(404);
    throw new Error('الإشعار غير موجود');
  }

  res.json({ message: 'تم وضع علامة "مقروء" على الإشعار', notification });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipientId: String(req.user._id), read: false },
    { $set: { read: true } }
  );

  res.json({ message: 'تم تحديث جميع الإشعارات كمقروءة' });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid notification id');
  }

  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipientId: String(req.user._id),
  });

  if (!notification) {
    res.status(404);
    throw new Error('الإشعار غير موجود');
  }

  res.json({ message: 'تم حذف الإشعار بنجاح' });
});