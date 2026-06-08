import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';
import { AppError } from '../middleware/error';
import { successResponse } from '../utils';

// GET /chats — list user's chats
export const getUserChats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const chats = await chatService.getUserChats(req.user.userId);
    res.status(200).json(successResponse(chats, 'Chats retrieved'));
  } catch (err) { next(err); }
};

// POST /chats — get or create chat with another user
export const getOrCreateChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { userId } = req.body as { userId: string };
    if (!userId) throw new AppError('userId is required', 400, true, 'VALIDATION_ERROR');
    const chat = await chatService.getOrCreateChat(req.user.userId, userId);
    res.status(200).json(successResponse(chat, 'Chat ready'));
  } catch (err) { next(err); }
};

// GET /chats/:chatId/messages — paginated messages
export const getChatMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { cursor, limit } = req.query as { cursor?: string; limit?: string };
    const result = await chatService.getChatMessages(
      req.params.chatId,
      req.user.userId,
      cursor,
      limit ? parseInt(limit) : 30,
    );
    res.status(200).json(successResponse(result, 'Messages retrieved'));
  } catch (err) { next(err); }
};

// GET /chats/online-contacts — get user's online following
export const getOnlineContacts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const contacts = await chatService.getOnlineContacts(req.user.userId);
    res.status(200).json(successResponse(contacts, 'Online contacts retrieved'));
  } catch (err) { next(err); }
};

// POST /chats/:chatId/read — mark messages as read
export const markChatAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    await chatService.markChatAsRead(req.params.chatId, req.user.userId);
    res.status(200).json(successResponse(null, 'Chat marked as read'));
  } catch (err) { next(err); }
};

// DELETE /chats/:chatId — soft delete chat for user
export const deleteChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    await chatService.deleteChat(req.params.chatId, req.user.userId);
    res.status(200).json(successResponse(null, 'Chat deleted'));
  } catch (err) { next(err); }
};

// POST /chats/:chatId/mute — toggle mute for chat
export const muteChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { duration } = req.body as { duration: number };
    const result = await chatService.muteChat(req.params.chatId, req.user.userId, duration || 24);
    res.status(200).json(successResponse(result, result.isMuted ? 'Chat muted' : 'Chat unmuted'));
  } catch (err) { next(err); }
};

// POST /chats/:chatId/messages — send message (REST fallback, primarily using Socket.IO)
export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { type, text } = req.body as { type: string; text?: string };
    const message = await chatService.createMessage(
      req.params.chatId,
      req.user.userId,
      { type: type as any, text },
    );
    res.status(201).json(successResponse(message, 'Message sent'));
  } catch (err) { next(err); }
};

// POST /chats/messages/:messageId/upload-image — upload image message
export const uploadMessageImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    if (!req.file) throw new AppError('Image file is required', 400, true, 'VALIDATION_ERROR');
    
    const { chatId } = req.body as { chatId: string };
    if (!chatId) throw new AppError('chatId is required', 400, true, 'VALIDATION_ERROR');
    
    const message = await chatService.uploadImageMessage(chatId, req.user.userId, req.file);
    res.status(201).json(successResponse(message, 'Image uploaded'));
  } catch (err) { next(err); }
};

// DELETE /chats/:chatId/messages/:messageId — soft delete
export const deleteMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const message = await chatService.deleteMessage(req.params.messageId, req.user.userId);
    res.status(200).json(successResponse(message, 'Message deleted'));
  } catch (err) { next(err); }
};
