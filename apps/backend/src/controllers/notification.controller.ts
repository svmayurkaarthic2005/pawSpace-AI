import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { AppError } from '../middleware/error';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export class NotificationController {
  /**
   * GET /notifications
   * Get paginated notifications with tab filtering.
   */
  async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, true, 'UNAUTHORIZED');
      }

      const tab = (req.query.tab as 'all' | 'activity') ?? 'all';
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string, 10) || 30;

      const result = await notificationService.getNotifications(userId, tab, cursor, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /notifications/unread-count
   * Get unread notification count from Redis.
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, true, 'UNAUTHORIZED');
      }

      const count = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /notifications/mark-read
   * Mark all notifications as read.
   */
  async markAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, true, 'UNAUTHORIZED');
      }

      const updated = await notificationService.markAllRead(userId);

      res.status(200).json({
        success: true,
        data: { updated },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /notifications/:id/read
   * Mark a single notification as read.
   */
  async markOneRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, true, 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const success = await notificationService.markOneRead(userId, id);

      if (!success) {
        throw new AppError('Notification not found or already read', 404, true, 'NOTIFICATION_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: { ok: true },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /notifications/:id
   * Delete a single notification.
   */
  async deleteNotification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, true, 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const success = await notificationService.deleteNotification(userId, id);

      if (!success) {
        throw new AppError('Notification not found', 404, true, 'NOTIFICATION_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: { ok: true },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /notifications
   * Clear all notifications for the user.
   */
  async clearAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, true, 'UNAUTHORIZED');
      }

      const deleted = await notificationService.clearAll(userId);

      res.status(200).json({
        success: true,
        data: { deleted },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /notifications/sync
   * Synchronize Redis unread count with MongoDB (recovers from race conditions).
   */
  async syncCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', 401, true, 'UNAUTHORIZED');
      }

      const count = await notificationService.syncUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
