import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getAdminStats,
  getAdminUsers,
  updateUserAdmin,
  deleteUserAdmin,
  getAdminListings,
  updateListingAdmin,
  deleteListingAdmin,
  getAdminBookings,
  updateBookingAdmin,
  getAdminMessages,
  updateAdminMessage,
  deleteAdminMessage,
  updateHostRequest,
  sendAdminNotification,
} from '../controllers/adminController.js';

const router = express.Router();

// تطبيق الحماية الخاصة بالآدمن على كافة المسارات الموالية
router.use(protect, adminOnly);

// الإحصائيات والإشعارات
router.get('/stats', getAdminStats);
router.post('/notifications', sendAdminNotification);

// إدارة المستخدمين
router.route('/users')
  .get(getAdminUsers);

router.route('/users/:id')
  .patch(updateUserAdmin)
  .delete(deleteUserAdmin);

// إدارة العقارات (Listings/Properties)
router.route('/listings')
  .get(getAdminListings);

router.route('/listings/:id')
  .patch(updateListingAdmin)
  .delete(deleteListingAdmin);

// إدارة الحجوزات
router.route('/bookings')
  .get(getAdminBookings);

router.patch('/bookings/:id', updateBookingAdmin);

// إدارة الرسائل وطلبات الدعم
router.route('/messages')
  .get(getAdminMessages);

router.route('/messages/:id')
  .patch(updateAdminMessage)
  .delete(deleteAdminMessage);

// طلبات الترقية لـ Host
router.patch('/host-requests/:id', updateHostRequest);

export default router;