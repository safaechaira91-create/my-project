import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import Notification from '../models/Notification.js';
import { formatDate, sendEmail } from '../utils/email.js';
import {
  calculateNights,
  ensureBookingCanBeCreated,
  findOverlappingBooking,
  getPriceNumber,
  normalizeGuestCount,
  parseBookingDate,
} from '../utils/booking.js';

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const assertHostCanManageBooking = (booking, user) => {
  const hostId = booking.listing?.host?._id || booking.listing?.host;
  if (!hostId || (hostId.toString() !== user._id.toString() && user.role !== 'admin')) {
    const error = new Error('Not authorized to manage this booking');
    error.statusCode = 403;
    throw error;
  }
};

// Applies refund logic consistently wherever a booking gets cancelled.
const applyCancellationRefund = (booking) => {
  if (booking.paymentMethod === 'paypal' && booking.paymentStatus === 'paid') {
    booking.paymentStatus = 'refunded';
    booking.refundAmount = Number(booking.totalPrice || 0);
    booking.refundedAt = new Date();
  }
};

const sendBookingRequestEmail = async ({ booking, listing, guest }) => {
  const hostEmail = listing.host?.email;
  if (!hostEmail) return;
  const manageUrl = `${getFrontendUrl()}/host-bookings`;
  const details = [
    `Property: ${listing.title}`,
    `Guest: ${guest?.name || 'Guest'}`,
    `Check-in: ${formatDate(booking.startDate)}`,
    `Check-out: ${formatDate(booking.endDate)}`,
    `Guests: ${booking.guests}`,
  ].join('\n');
  await sendEmail({
    to: hostEmail,
    subject: `New booking request for ${listing.title}`,
    text: `${details}\n\nApprove or reject this request from: ${manageUrl}`,
    html: `
      <h2>New booking request</h2>
      <p><strong>Property:</strong> ${listing.title}</p>
      <p><strong>Guest:</strong> ${guest?.name || 'Guest'}</p>
      <p><strong>Check-in:</strong> ${formatDate(booking.startDate)}</p>
      <p><strong>Check-out:</strong> ${formatDate(booking.endDate)}</p>
      <p><strong>Guests:</strong> ${booking.guests}</p>
      <p>
        <a href="${manageUrl}" style="display:inline-block;padding:10px 14px;background:#2DB4A0;color:#fff;text-decoration:none;border-radius:8px;">Approve booking</a>
        <a href="${manageUrl}" style="display:inline-block;padding:10px 14px;background:#ef4444;color:#fff;text-decoration:none;border-radius:8px;margin-left:8px;">Reject booking</a>
      </p>
    `,
  });
};

const bookingDecisionCopy = {
  confirmed: {
    subject: 'Your MyDar booking was approved',
    message: (title) => `Your booking for ${title} has been approved.`,
  },
  rejected: {
    subject: 'Your MyDar booking was rejected',
    message: (title) => `Your booking for ${title} has been rejected.`,
  },
  cancelled: {
    subject: 'Your MyDar booking was cancelled',
    message: (title) => `Your booking for ${title} has been cancelled.`,
  },
  completed: {
    subject: 'Your MyDar stay is now complete',
    message: (title) => `Your booking for ${title} has been marked as completed.`,
  },
};

const sendBookingDecisionEmail = async ({ booking, status }) => {
  const guestEmail = booking.user?.email;
  const copy = bookingDecisionCopy[status];
  if (!guestEmail || !copy) return;

  const message = copy.message(booking.listing.title);
  await sendEmail({
    to: guestEmail,
    subject: copy.subject,
    text: `${message}\nCheck-in: ${formatDate(booking.startDate)}\nCheck-out: ${formatDate(booking.endDate)}`,
    html: `
      <h2>${copy.subject}</h2>
      <p>${message}</p>
      <p><strong>Check-in:</strong> ${formatDate(booking.startDate)}</p>
      <p><strong>Check-out:</strong> ${formatDate(booking.endDate)}</p>
    `,
  });
};

const notifyGuestBookingDecision = async ({ booking, status }) => {
  const copy = bookingDecisionCopy[status];
  if (!copy) return;

  await Notification.create({
    recipientId: String(booking.user?._id || booking.user),
    senderName: 'MyDar Host',
    message: copy.message(booking.listing.title),
    bookingId: String(booking._id),
  });
};

export const createBooking = asyncHandler(async (req, res) => {
  const {
    listingId,
    propertyId,
    startDate,
    endDate,
    checkIn,
    checkOut,
    guests = 1,
    paymentMethod = 'cash',
    paypalOrderId = '',
  } = req.body;

  const targetId = listingId || propertyId;
  const finalStartDate = parseBookingDate(startDate || checkIn);
  const finalEndDate = parseBookingDate(endDate || checkOut);
  const finalPaymentMethod = String(paymentMethod || 'cash').toLowerCase() === 'paypal' ? 'paypal' : 'cash';
  const finalPaypalOrderId = String(paypalOrderId || '').trim();

  if (finalPaypalOrderId.length > 200) {
    res.status(400);
    throw new Error('Invalid PayPal Order');
  }

  const finalGuests = normalizeGuestCount(guests, Number.MAX_SAFE_INTEGER);

  if (!targetId || !finalStartDate || !finalEndDate || finalGuests === null) {
    res.status(400);
    throw new Error('Missing booking details');
  }

  if (finalEndDate <= finalStartDate) {
    res.status(400);
    throw new Error('Checkout date must be after check-in date');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (finalStartDate < today) {
    res.status(400);
    throw new Error('Check-in date cannot be in the past');
  }

  const recentBookings = await Booking.countDocuments({
    user: req.user._id,
    createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
  });

  if (recentBookings >= 5) {
    res.status(429);
    throw new Error('Too many booking attempts');
  }

  const session = await mongoose.startSession();
  let booking;
  let listing;

  try {
    await session.withTransaction(async () => {
      listing = await Property.findById(targetId).populate('host', 'name email').session(session);

      ensureBookingCanBeCreated(listing);

      if (finalGuests > Number(listing.guests || 1)) {
        const guestError = new Error('Guest count exceeds property capacity');
        guestError.statusCode = 400;
        throw guestError;
      }

      const overlappingBooking = await findOverlappingBooking(targetId, finalStartDate, finalEndDate, session);
      if (overlappingBooking) {
        const overlapError = new Error('These dates are already booked');
        overlapError.statusCode = 400;
        throw overlapError;
      }

      const nights = calculateNights(finalStartDate, finalEndDate);
      const totalPrice = nights * getPriceNumber(listing.price);

      [booking] = await Booking.create(
        [
          {
            user: req.user._id,
            listing: targetId,
            startDate: finalStartDate,
            endDate: finalEndDate,
            totalPrice,
            guests: finalGuests,
            paymentMethod: finalPaymentMethod,
            paymentStatus: finalPaymentMethod === 'paypal' ? 'paid' : 'pending',
            paypalOrderId: finalPaypalOrderId,
            status: 'pending',
          },
        ],
        { session }
      );

      await Notification.create(
        [
          {
            recipientId: String(listing.host?._id || listing.host),
            senderName: req.user?.name || 'MyDar Guest',
            message: `New booking request for your property: ${listing.title}`,
            bookingId: String(booking._id),
          },
        ],
        { session }
      );
    });
  } finally {
    session.endSession();
  }

  await sendBookingRequestEmail({ booking, listing, guest: req.user });

  res.status(201).json(booking);
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('listing', 'title images location price')
    .sort({ createdAt: -1 });
  res.json(bookings);
});

export const cancelBooking = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid booking id');
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  if (['cancelled', 'rejected', 'completed'].includes(booking.status)) {
    res.status(400);
    throw new Error('This booking cannot be cancelled');
  }

  booking.status = 'cancelled';
  applyCancellationRefund(booking);
  await booking.save();
  res.json({ message: 'Booking cancelled successfully' });
});

export const getPropertyBookings = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.listingId)) {
    res.status(400);
    throw new Error('Invalid property id');
  }

  const bookings = await Booking.find({
    listing: req.params.listingId,
    status: { $nin: ['cancelled', 'rejected'] },
  }).select('startDate endDate');

  res.json(bookings);
});

export const getHostBookings = asyncHandler(async (req, res) => {
  if (req.user.role !== 'host' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only hosts can view host bookings');
  }

  const hostListingIds = (await Property.find({ host: req.user._id }).select('_id')).map((listing) => listing._id);

  const bookings = await Booking.find({ listing: { $in: hostListingIds } })
    .populate('user', 'name email')
    .populate('listing', 'title images location price host')
    .sort({ createdAt: -1 });

  res.json(bookings);
});

export const approveBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'name email')
    .populate('listing', 'title host');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  assertHostCanManageBooking(booking, req.user);
  if (booking.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending bookings can be approved');
  }

  booking.status = 'confirmed';
  await booking.save();

  await notifyGuestBookingDecision({ booking, status: 'confirmed' });
  await sendBookingDecisionEmail({ booking, status: 'confirmed' });
  res.json({ message: 'Booking approved successfully', booking });
});

export const rejectBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'name email')
    .populate('listing', 'title host');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  assertHostCanManageBooking(booking, req.user);
  if (booking.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending bookings can be rejected');
  }

  booking.status = 'rejected';
  await booking.save();

  await notifyGuestBookingDecision({ booking, status: 'rejected' });
  await sendBookingDecisionEmail({ booking, status: 'rejected' });
  res.json({ message: 'Booking rejected successfully', booking });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'name email')
    .populate('listing');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  assertHostCanManageBooking(booking, req.user);

  if (!['pending', 'confirmed', 'rejected', 'cancelled', 'completed'].includes(status)) {
    res.status(400);
    throw new Error('Invalid booking status');
  }

  if (booking.status === 'completed' || booking.status === 'cancelled') {
    res.status(400);
    throw new Error('Booking cannot be modified');
  }

  const previousStatus = booking.status;
  booking.status = status;

  if (status === 'cancelled') {
    applyCancellationRefund(booking);
  }

  await booking.save();

  // Keep the guest informed regardless of which route the host used to change status.
  if (previousStatus !== status && ['confirmed', 'rejected', 'cancelled', 'completed'].includes(status)) {
    await notifyGuestBookingDecision({ booking, status });
    await sendBookingDecisionEmail({ booking, status });
  }

  res.json({ message: 'Booking status updated successfully', booking });
});