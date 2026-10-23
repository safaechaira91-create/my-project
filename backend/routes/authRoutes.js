import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// حماية محددة للـ Authentication المعرضة للهجمات (تسجيل الدخول وإعادة التعيين)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'محاولات كثيرة جداً، يرجى المحاولة مرة أخرى بعد 15 دقيقة.' },
});

// Rate limiter أسرع وخاص بإنعاش الـ Tokens لمنع تعطيل الجلسات الناجحة
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'طلبات كثيرة لإنعاش الجلسة، يرجى الانتظار.' },
});

// التسجيل والدخول والخروج
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', protect, logoutUser);
router.post('/refresh', refreshLimiter, refreshAccessToken);

// البروفايل والمعلومات الشخصية
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.get('/me', protect, getUserProfile);

// تفعيل البريد الإلكتروني
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerificationEmail);

// استعادة كلمة المرور
router.post('/forgot-password', authLimiter, requestPasswordReset);
router.post('/reset-password/:token', authLimiter, resetPassword);

export default router;