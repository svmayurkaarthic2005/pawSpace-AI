import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import {
  getUserChats,
  getOrCreateChat,
  getChatMessages,
  deleteMessage,
  getOnlineContacts,
  markChatAsRead,
  deleteChat,
  muteChat,
  sendMessage,
  uploadMessageImage,
} from '../controllers/chat.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Chat list and management
router.get('/', authenticate, getUserChats);
router.get('/online-contacts', authenticate, getOnlineContacts);
router.post('/', authenticate, getOrCreateChat);
router.delete('/:chatId', authenticate, deleteChat);
router.post('/:chatId/mute', authenticate, muteChat);
router.post('/:chatId/read', authenticate, markChatAsRead);

// Messages
router.get('/:chatId/messages', authenticate, getChatMessages);
router.post('/:chatId/messages', authenticate, sendMessage);
router.post('/messages/upload-image', authenticate, upload.single('image'), uploadMessageImage);
router.delete('/:chatId/messages/:messageId', authenticate, deleteMessage);

export default router;
