import express from 'express';
import {
  approveBooking,
  cancelBooking,
  createBooking,
  getHostBookings,
  getMyBookings,
  getPropertyBookings,
  rejectBooking,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. المسارات العامة والخاصة بالحساب الشخصي
router
  .route('/')
  .post(protect, createBooking)
  .get(protect, getMyBookings);

// 2. مسارات الاستعلام الخاصة بـ Host / Admin (تأتي قبل المسارات الديناميكية /:id)
router
  .route('/host-bookings')
  .get(protect, authorize('host', 'admin'), getHostBookings);

router
  .route('/listing/:listingId')
  .get(protect, authorize('host', 'admin'), getPropertyBookings);

// 3. المسارات المعتمدة على معرّف الحجز (/:id)
router
  .route('/:id/cancel')
  .put(protect, authorize('user', 'host', 'admin'), cancelBooking);

router
  .route('/:id/approve')
  .post(protect, authorize('host', 'admin'), approveBooking);

router
  .route('/:id/reject')
  .post(protect, authorize('host', 'admin'), rejectBooking);

router
  .route('/:id/status')
  .put(protect, authorize('host', 'admin'), updateBookingStatus);

export default router;