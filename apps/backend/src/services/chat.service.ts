import mongoose from 'mongoose';
import { Chat, IChat } from '../models/chat.model';
import { Message, IMessage } from '../models/message.model';
import { AppError } from '../middleware/error';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendMessageInput {
  type: 'text' | 'image' | 'ai_suggestion';
  text?: string;
  mediaUrl?: string;
  publicId?: string;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ChatService {
  /**
   * Find an existing 1-on-1 chat between two users, or create one.
   */
  async getOrCreateChat(userId1: string, userId2: string): Promise<IChat> {
    if (userId1 === userId2) {
      throw new AppError('Cannot create a chat with yourself', 400, true, 'SELF_CHAT');
    }

    const id1 = new mongoose.Types.ObjectId(userId1);
    const id2 = new mongoose.Types.ObjectId(userId2);

    const existing = await Chat.findOne({
      participants: { $all: [id1, id2], $size: 2 },
    })
      .populate('participants', 'username name avatar isOnline lastSeen')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username name avatar' } })
      .exec();

    if (existing) return existing;

    const { Block } = await import('../models/block.model');
    const hasBlock = await Block.exists({
      $or: [
        { blocker: id1, blocked: id2 },
        { blocker: id2, blocked: id1 }
      ]
    });

    if (hasBlock) {
      throw new AppError('Cannot create chat, user is blocked', 403, true, 'FORBIDDEN');
    }

    // Create new chat
    const chat = new Chat({
      participants: [id1, id2],
      unreadCounts: { [userId1]: 0, [userId2]: 0 },
    });
    await chat.save();

    return Chat.findById(chat._id)
      .populate('participants', 'username name avatar isOnline lastSeen')
      .exec() as Promise<IChat>;
  }

  /**
   * Save a message to DB, update Chat.lastMessage + lastMessageAt,
   * increment unread count for the recipient.
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    content: SendMessageInput,
  ): Promise<IMessage> {
    const chat = await Chat.findById(chatId).exec();
    if (!chat) throw new AppError('Chat not found', 404, true, 'CHAT_NOT_FOUND');

    const isParticipant = chat.participants.some((p) => p.toString() === senderId);
    if (!isParticipant) throw new AppError('Not a participant', 403, true, 'FORBIDDEN');

    const recipientId = chat.participants.find((p) => p.toString() !== senderId)?.toString();

    if (recipientId) {
      const { Block } = await import('../models/block.model');
      const hasBlock = await Block.exists({
        $or: [
          { blocker: senderId, blocked: recipientId },
          { blocker: recipientId, blocked: senderId }
        ]
      });

      if (hasBlock) {
        throw new AppError('Cannot send message, user is blocked', 403, true, 'FORBIDDEN');
      }
    }

    // Create message
    const message = new Message({
      chat: chatId,
      sender: senderId,
      content,
    });
    await message.save();

    // Update chat metadata

    const unreadUpdate: Record<string, unknown> = {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    };

    // Increment recipient's unread count
    if (recipientId) {
      unreadUpdate[`unreadCounts.${recipientId}`] = (chat.unreadCounts.get(recipientId) ?? 0) + 1;
    }

    await Chat.findByIdAndUpdate(chatId, { $set: unreadUpdate }).exec();

    // Return populated message
    return Message.findById(message._id)
      .populate('sender', 'username name avatar')
      .exec() as Promise<IMessage>;
  }

  /**
   * Cursor-based message pagination (newest first when inverted in UI).
   * Excludes soft-deleted messages for this user.
   */
  async getChatMessages(
    chatId: string,
    userId: string,
    cursor?: string,
    limit: number = 30,
  ): Promise<{ messages: IMessage[]; nextCursor: string | null; hasMore: boolean }> {
    const chat = await Chat.findById(chatId).exec();
    if (!chat) throw new AppError('Chat not found', 404, true, 'CHAT_NOT_FOUND');

    const isParticipant = chat.participants.some((p) => p.toString() === userId);
    if (!isParticipant) throw new AppError('Not a participant', 403, true, 'FORBIDDEN');

    const userIdObj = new mongoose.Types.ObjectId(userId);
    const query: mongoose.FilterQuery<IMessage> = {
      chat: chatId,
      isDeleted: false,
      deletedFor: { $ne: userIdObj },
    };

    if (cursor) {
      const cursorMsg = await Message.findById(cursor).select('createdAt').lean().exec();
      if (cursorMsg) {
        query.createdAt = { $lt: cursorMsg.createdAt };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('sender', 'username name avatar')
      .lean()
      .exec();

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    const nextCursor = hasMore && messages.length > 0 ? messages[messages.length - 1]._id.toString() : null;

    return {
      messages: messages as unknown as IMessage[],
      nextCursor,
      hasMore,
    };
  }

  /**
   * Get all chats for a user, sorted by most recent activity.
   * Excludes deleted chats and adds computed fields (isOnline, isMuted, unreadCount).
   */
  async getUserChats(userId: string): Promise<any[]> {
    const { redis } = await import('../config/redis');
    const userIdObj = new mongoose.Types.ObjectId(userId);

    const chats = await Chat.find({
      participants: userIdObj,
      isActive: true,
      deletedFor: { $ne: userIdObj },
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username name avatar isOnline lastSeen isVerified')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username name avatar' },
      })
      .lean()
      .exec();

    // Add computed fields for each chat
    const enrichedChats = await Promise.all(
      chats.map(async (chat: any) => {
        // Find the other user (not current user)
        const otherUser = chat.participants.find(
          (p: any) => p._id.toString() !== userId,
        );

        // Check if other user is online via Redis
        const isOnline = otherUser
          ? await redis.exists(`presence:${otherUser._id.toString()}`)
          : false;

        // Check if chat is muted for current user
        const muteInfo = chat.isMuted?.find(
          (m: any) => m.user.toString() === userId,
        );
        const isMuted = muteInfo && new Date(muteInfo.mutedUntil) > new Date();

        // Get unread count for current user
        const unreadCount = chat.unreadCounts?.[userId] ?? 0;

        return {
          ...chat,
          otherUser,
          isOnline: !!isOnline,
          isMuted: !!isMuted,
          unreadCount,
        };
      }),
    );

    return enrichedChats;
  }

  /**
   * Mark all messages in a chat as read up to (and including) messageId.
   * Resets the unread count for the user.
   */
  async markAsRead(chatId: string, userId: string, messageId: string): Promise<void> {
    const now = new Date();

    // Add read receipt to all unread messages up to messageId
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: new mongoose.Types.ObjectId(userId) },
        'readBy.user': { $ne: new mongoose.Types.ObjectId(userId) },
        _id: { $lte: new mongoose.Types.ObjectId(messageId) },
      },
      {
        $push: {
          readBy: { user: new mongoose.Types.ObjectId(userId), readAt: now },
        },
      },
    ).exec();

    // Reset unread count for this user
    await Chat.findByIdAndUpdate(chatId, {
      $set: { [`unreadCounts.${userId}`]: 0 },
    }).exec();
  }

  /**
   * Soft-delete a message (only sender can delete).
   */
  async deleteMessage(messageId: string, userId: string): Promise<IMessage> {
    const message = await Message.findById(messageId).exec();
    if (!message) throw new AppError('Message not found', 404, true, 'NOT_FOUND');
    if (message.sender.toString() !== userId) {
      throw new AppError('Cannot delete another user\'s message', 403, true, 'FORBIDDEN');
    }
    message.isDeleted = true;
    await message.save();
    return message;
  }

  /**
   * Verify a user is a participant in a chat.
   */
  async verifyParticipant(chatId: string, userId: string): Promise<boolean> {
    const chat = await Chat.findById(chatId).select('participants').exec();
    if (!chat) return false;
    return chat.participants.some((p) => p.toString() === userId);
  }

  /**
   * Get online contacts (users who follow current user and are currently online).
   */
  async getOnlineContacts(userId: string): Promise<any[]> {
    const { Follow } = await import('../models/follow.model');
    const { User } = await import('../models/user.model');
    const { redis } = await import('../config/redis');

    // Get user's following IDs
    const follows = await Follow.find({ follower: userId }).select('following').lean().exec();
    const followingIds = follows.map((f: any) => f.following.toString());

    if (followingIds.length === 0) return [];

    // Check which ones are online (have presence in Redis)
    const onlineUserIds: string[] = [];
    for (const followingId of followingIds) {
      const isOnline = await redis.exists(`presence:${followingId}`);
      if (isOnline) {
        onlineUserIds.push(followingId);
      }
    }

    if (onlineUserIds.length === 0) return [];

    // Fetch user details for online users
    const onlineUsers = await User.find({
      _id: { $in: onlineUserIds.map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .select('username name avatar')
      .limit(15)
      .lean()
      .exec();

    return onlineUsers;
  }

  /**
   * Mark all unread messages in a chat as read.
   */
  async markChatAsRead(chatId: string, userId: string): Promise<void> {
    const now = new Date();

    // Add read receipt to all unread messages
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: new mongoose.Types.ObjectId(userId) },
        'readBy.user': { $ne: new mongoose.Types.ObjectId(userId) },
      },
      {
        $push: {
          readBy: { user: new mongoose.Types.ObjectId(userId), readAt: now },
        },
      },
    ).exec();

    // Reset unread count for this user
    await Chat.findByIdAndUpdate(chatId, {
      $set: { [`unreadCounts.${userId}`]: 0 },
    }).exec();
  }

  /**
   * Soft delete a chat for a specific user.
   */
  async deleteChat(chatId: string, userId: string): Promise<void> {
    await Chat.findByIdAndUpdate(chatId, {
      $addToSet: { deletedFor: new mongoose.Types.ObjectId(userId) },
    }).exec();
  }

  /**
   * Mute or unmute a chat for a user.
   */
  async muteChat(
    chatId: string,
    userId: string,
    durationHours: number,
  ): Promise<{ isMuted: boolean }> {
    const chat = await Chat.findById(chatId).exec();
    if (!chat) throw new AppError('Chat not found', 404, true, 'CHAT_NOT_FOUND');

    const userIdObj = new mongoose.Types.ObjectId(userId);
    const existingMute = chat.isMuted.find((m: any) => m.user.toString() === userId);

    if (existingMute) {
      // Unmute
      await Chat.findByIdAndUpdate(chatId, {
        $pull: { isMuted: { user: userIdObj } },
      }).exec();
      return { isMuted: false };
    } else {
      // Mute
      const mutedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);
      await Chat.findByIdAndUpdate(chatId, {
        $push: { isMuted: { user: userIdObj, mutedUntil } },
      }).exec();
      return { isMuted: true };
    }
  }

  /**
   * Create a message (used by REST endpoint and socket handler).
   */
  async createMessage(
    chatId: string,
    senderId: string,
    content: SendMessageInput,
  ): Promise<IMessage> {
    return this.sendMessage(chatId, senderId, content);
  }

  /**
   * Upload an image message.
   */
  async uploadImageMessage(
    chatId: string,
    senderId: string,
    file: Express.Multer.File,
  ): Promise<IMessage> {
    const { uploadImage } = await import('../utils/cloudinary.util');

    // Upload to Cloudinary
    const { url, publicId } = await uploadImage(file.buffer, 'pawspace/messages');

    // Create message
    return this.sendMessage(chatId, senderId, {
      type: 'image',
      mediaUrl: url,
      publicId: publicId,
    });
  }
}

export const chatService = new ChatService();
