import express from 'express';
import {
  createPayPalOrder,
  capturePayPalOrder,
  getOrderDetails,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// حماية كافة مسارات الطلبات والدفع
router.use(protect);

// 1. مسارات معالجة الدفع عبر PayPal
router.post('/create', createPayPalOrder);
router.post('/capture', capturePayPalOrder);

// 2. تفاصيل الطلب حسب المعرف (/:id)
router.get('/:id', getOrderDetails);

export default router;