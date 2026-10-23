import paypal from '@paypal/checkout-server-sdk';
import mongoose from 'mongoose';
import paypalClient from '../config/paypal.js';
import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import Notification from '../models/Notification.js';
import asyncHandler from 'express-async-handler';
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

const getBookingSnapshot = (body) => {
  const { listingId, propertyId, startDate, endDate, checkIn, checkOut, guests = 1 } = body;
  const targetId = listingId || propertyId;
  const finalStartDate = parseBookingDate(startDate || checkIn);
  const finalEndDate = parseBookingDate(endDate || checkOut);

  return {
    targetId,
    finalStartDate,
    finalEndDate,
    guests: normalizeGuestCount(guests, Number.MAX_SAFE_INTEGER),
  };
};

// Shared validation for booking date/guest constraints (used by both cash & PayPal flows).
const validateBookingRequest = ({ targetId, finalStartDate, finalEndDate, guests }) => {
  if (!targetId || !finalStartDate || !finalEndDate || guests === null) {
    const error = new Error('Missing booking details');
    error.statusCode = 400;
    throw error;
  }

  if (finalEndDate <= finalStartDate) {
    const error = new Error('Checkout date must be after check-in date');
    error.statusCode = 400;
    throw error;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (finalStartDate < today) {
    const error = new Error('Check-in date cannot be in the past');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    const error = new Error('Invalid property id');
    error.statusCode = 400;
    throw error;
  }
};

const sendPaidBookingGuestEmail = async ({ booking, listing }) => {
  const guestEmail = booking.user?.email;
  if (!guestEmail) return;

  await sendEmail({
    to: guestEmail,
    subject: 'Your MyDar payment was received',
    text: `Your payment for ${listing.title} was received and your booking is confirmed.\nCheck-in: ${formatDate(booking.startDate)}\nCheck-out: ${formatDate(booking.endDate)}`,
    html: `
      <h2>Payment received</h2>
      <p>Your booking for <strong>${listing.title}</strong> is confirmed.</p>
      <p><strong>Check-in:</strong> ${formatDate(booking.startDate)}</p>
      <p><strong>Check-out:</strong> ${formatDate(booking.endDate)}</p>
    `,
  });
};

// @desc    Create PayPal Order
export const createPayPalOrder = asyncHandler(async (req, res) => {
  const snapshot = getBookingSnapshot(req.body);
  const { targetId, finalStartDate, finalEndDate, guests } = snapshot;

  try {
    validateBookingRequest(snapshot);
  } catch (error) {
    res.status(error.statusCode || 400);
    throw error;
  }

  const listing = await Property.findById(targetId).populate('host', 'name email');
  ensureBookingCanBeCreated(listing);

  if (guests > Number(listing.guests || 1)) {
    res.status(400);
    throw new Error('Guest count exceeds property capacity');
  }

  const nights = calculateNights(finalStartDate, finalEndDate);
  const totalPrice = nights * getPriceNumber(listing.price);
  const paypalCurrency = 'USD';
  const paypalAmount = Number(totalPrice.toFixed(2));

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: paypalCurrency,
          value: paypalAmount.toFixed(2),
        },
        description: `Booking for ${listing.title}`,
      },
    ],
  });

  const response = await paypalClient.execute(request);

  await Order.create({
    user: req.user._id,
    booking: null,
    paypalOrderId: response.result.id,
    paymentStatus: 'CREATED',
    amount: { total: paypalAmount, currency: paypalCurrency },
    bookingSnapshot: {
      listing: targetId,
      startDate: finalStartDate,
      endDate: finalEndDate,
      guests,
      totalPrice,
      paymentMethod: 'paypal',
      paymentStatus: 'pending',
    },
  });

  res.status(201).json({ id: response.result.id });
});

// @desc    Capture PayPal Order & Confirm Booking
export const capturePayPalOrder = asyncHandler(async (req, res) => {
  const { orderID } = req.body;

  if (!orderID) {
    res.status(400);
    throw new Error('Missing PayPal order ID');
  }

  if (typeof orderID !== 'string' || orderID.length > 100) {
    res.status(400);
    throw new Error('Invalid PayPal order id');
  }

  const order = await Order.findOne({ paypalOrderId: orderID, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.isPaid && order.booking) {
    const existingBooking = await Booking.findById(order.booking);
    if (existingBooking) {
      return res.json({ success: true, message: 'Payment completed successfully', booking: existingBooking });
    }
  }

  if (!order.bookingSnapshot?.listing || !order.bookingSnapshot?.startDate || !order.bookingSnapshot?.endDate) {
    res.status(400);
    throw new Error('Booking snapshot is missing');
  }

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);
    const paymentDetails = capture.result;

    if (paymentDetails.status !== 'COMPLETED') {
      res.status(400);
      throw new Error('Payment did not complete');
    }

    const capturedAmount = paymentDetails.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
    const expectedCurrency = order.amount?.currency || 'USD';
    const expectedAmount = Number(order.amount?.total || 0).toFixed(2);
    const actualAmount = Number(capturedAmount?.value || 0).toFixed(2);

    if (capturedAmount?.currency_code !== expectedCurrency || actualAmount !== expectedAmount) {
      res.status(400);
      throw new Error('Captured amount does not match the expected booking amount');
    }

    const session = await mongoose.startSession();
    let booking;
    let listing;

    try {
      await session.withTransaction(async () => {
        const lockedOrder = await Order.findOne({ paypalOrderId: orderID, user: req.user._id }).session(session);
        if (!lockedOrder) {
          const orderError = new Error('Order not found');
          orderError.statusCode = 404;
          throw orderError;
        }

        if (lockedOrder.isPaid && lockedOrder.booking) {
          booking = await Booking.findById(lockedOrder.booking).session(session);
          if (!booking) {
            const missingBookingError = new Error('Booking not found');
            missingBookingError.statusCode = 404;
            throw missingBookingError;
          }

          lockedOrder.booking = booking._id;
          lockedOrder.paymentStatus = 'COMPLETED';
          lockedOrder.isPaid = true;
          lockedOrder.paidAt = Date.now();
          lockedOrder.payerEmail = paymentDetails.payer?.email_address || '';
          await lockedOrder.save({ session });
          return;
        }

        listing = await Property.findById(lockedOrder.bookingSnapshot.listing).populate('host', 'name email').session(session);
        ensureBookingCanBeCreated(listing);

        if (Number(lockedOrder.bookingSnapshot.guests || 1) > Number(listing.guests || 1)) {
          const guestError = new Error('Guest count exceeds property capacity');
          guestError.statusCode = 400;
          throw guestError;
        }

        const overlappingBooking = await findOverlappingBooking(
          lockedOrder.bookingSnapshot.listing,
          lockedOrder.bookingSnapshot.startDate,
          lockedOrder.bookingSnapshot.endDate,
          session
        );

        if (overlappingBooking) {
          const overlapError = new Error('These dates are already booked');
          overlapError.statusCode = 400;
          throw overlapError;
        }

        booking = await Booking.create(
          [
            {
              user: req.user._id,
              listing: lockedOrder.bookingSnapshot.listing,
              startDate: lockedOrder.bookingSnapshot.startDate,
              endDate: lockedOrder.bookingSnapshot.endDate,
              totalPrice: lockedOrder.bookingSnapshot.totalPrice,
              guests: lockedOrder.bookingSnapshot.guests,
              paymentMethod: 'paypal',
              paymentStatus: 'paid',
              paypalOrderId: orderID,
              status: 'confirmed',
            },
          ],
          { session }
        ).then((rows) => rows[0]);

        lockedOrder.booking = booking._id;
        lockedOrder.paymentStatus = 'COMPLETED';
        lockedOrder.isPaid = true;
        lockedOrder.paidAt = Date.now();
        lockedOrder.payerEmail = paymentDetails.payer?.email_address || '';
        await lockedOrder.save({ session });

        await Notification.create(
          [
            {
              recipientId: String(listing.host?._id || listing.host),
              senderName: req.user?.name || 'MyDar Guest',
              message: `New paid booking for your property: ${listing.title}`,
              bookingId: booking._id,
              type: 'payment',
            },
          ],
          { session }
        );
      });
    } finally {
      session.endSession();
    }

    const bookingResponse = booking || (order.booking ? await Booking.findById(order.booking) : null);

    // Best-effort guest confirmation email; failure here should not affect the API response
    // since the payment and booking are already confirmed at this point.
    if (bookingResponse && listing) {
      try {
        const populatedBooking = await Booking.findById(bookingResponse._id).populate('user', 'name email');
        await sendPaidBookingGuestEmail({ booking: populatedBooking, listing });
      } catch (emailError) {
        console.error('[capturePayPalOrder] Failed to send guest confirmation email:', emailError.message);
      }
    }

    res.json({ success: true, message: 'Payment completed successfully', booking: bookingResponse });
  } catch (error) {
    if (error.statusCode) {
      // Expected/validation errors: no need for a full stack trace in logs.
      console.warn('PayPal Capture Warning:', error.message);
      res.status(error.statusCode);
      throw new Error(error.message);
    }
    console.error('PayPal Capture Error:', error);
    res.status(500);
    throw new Error(error.message || 'Failed to verify payment');
  }
});

// @desc    Get order details
export const getOrderDetails = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid order id');
  }

  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('booking');

  if (order) {
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Access denied');
    }
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});