import express from 'express';
import {
  createChat,
  createMessage,
  getChats,
  getMessagesByChat,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// حماية جميع مسارات الدردشة تلقائياً
router.use(protect);

// إدارة المحادثات (Chats)
router
  .route('/')
  .get(getChats)
  .post(createChat);

router
  .route('/chats')
  .get(getChats)
  .post(createChat);

// إدارة الرسائل (Messages)
router.post('/messages', createMessage);
router.get('/messages/:chatId', getMessagesByChat);

export default router;