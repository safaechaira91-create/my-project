import express from 'express';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// حماية جميع مسارات الإشعارات تلقائياً
router.use(protect);

// 1. المسارات العامة والخاصة بجميع الإشعارات
// IMPORTANT: '/unread-count' must come BEFORE '/:id' so Express doesn't
// mistake "unread-count" for an :id parameter.
router.get('/', getNotifications);
router.get('/unread-count', getUnreadNotificationsCount);
router.patch('/read-all', markAllNotificationsAsRead);

// 2. المسارات المعتمدة على معرّف الإشعار (/:id)
router.route('/:id')
  .put(markNotificationAsRead)
  .patch(markNotificationAsRead)
  .delete(deleteNotification);

export default router;