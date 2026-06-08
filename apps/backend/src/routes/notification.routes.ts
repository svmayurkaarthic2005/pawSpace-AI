import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /notifications - Get paginated notifications with tab filtering
router.get('/', notificationController.getNotifications.bind(notificationController));

// GET /notifications/unread-count - Get unread count
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));

// POST /notifications/mark-read - Mark all as read
router.post('/mark-read', notificationController.markAllRead.bind(notificationController));

// POST /notifications/sync - Sync unread count with MongoDB
router.post('/sync', notificationController.syncCount.bind(notificationController));

// POST /notifications/:id/read - Mark one as read
router.post('/:id/read', notificationController.markOneRead.bind(notificationController));

// DELETE /notifications/:id - Delete one notification
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

// DELETE /notifications - Clear all notifications
router.delete('/', notificationController.clearAll.bind(notificationController));

export default router;
