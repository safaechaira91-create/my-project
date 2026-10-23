import asyncHandler from 'express-async-handler';
import SupportRequest from '../models/supportRequestModel.js';
import User from '../models/User.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @desc    Create a new support request
// @route   POST /api/support-requests
// @access  Public / Private
export const createSupportRequest = asyncHandler(async (req, res) => {
  const { name, email, message, type, language } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400);
    throw new Error('Name is required');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    res.status(400);
    throw new Error('A valid email is required');
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400);
    throw new Error('Message is required');
  }

  if (message.trim().length > 3000) {
    res.status(400);
    throw new Error('Message is too long');
  }

  const allowedTypes = ['support', 'host-upgrade'];
  const finalType = allowedTypes.includes(type) ? type : 'support';

  const request = await SupportRequest.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    message: message.trim(),
    type: finalType,
    language: language || 'ar',
    userId: req.user ? req.user._id : null,
  });

  res.status(201).json(request);
});

// @desc    Get all support requests
// @route   GET /api/support-requests
// @access  Private/Admin
export const getSupportRequests = asyncHandler(async (req, res) => {
  const requests = await SupportRequest.find({})
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });
  res.json(requests);
});

// @desc    Approve a host upgrade request
// @route   PUT /api/support-requests/:id/approve
// @access  Private/Admin
export const approveHostRequest = asyncHandler(async (req, res) => {
  const request = await SupportRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Support request not found');
  }

  request.status = 'approved';
  request.resolvedAt = Date.now();
  request.resolvedBy = req.user._id;
  await request.save();

  // Upgrade user role to host if userId exists
  if (request.userId) {
    const user = await User.findById(request.userId);
    if (user) {
      user.role = 'host';
      await user.save();
    }
  }

  res.json({ message: 'Request approved and user updated to host', request });
});

// @desc    Reject a support request
// @route   PUT /api/support-requests/:id/reject
// @access  Private/Admin
export const rejectHostRequest = asyncHandler(async (req, res) => {
  const request = await SupportRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Support request not found');
  }

  request.status = 'rejected';
  request.resolvedAt = Date.now();
  request.resolvedBy = req.user._id;
  await request.save();

  res.json({ message: 'Request rejected', request });
});