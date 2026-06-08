import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import petRoutes from './pet.routes';
import postRoutes from './post.routes';
import followRoutes from './follow.routes';
import chatRoutes from './chat.routes';
import communityRoutes from './community.routes';
import eventRoutes from './event.routes';
import aiRoutes from './ai.routes';
import exploreRoutes from './explore.routes';
import discoveryRoutes from './discovery.routes';
import googlePlacesRoutes from './googlePlaces.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/pets', petRoutes);
router.use('/posts', postRoutes);
router.use('/follow', followRoutes);
router.use('/chat', chatRoutes);
router.use('/communities', communityRoutes);
router.use('/events', eventRoutes);
router.use('/ai', aiRoutes);
router.use('/explore', exploreRoutes);
router.use('/search', exploreRoutes); // search endpoints also in explore routes
router.use('/discovery', discoveryRoutes);
router.use('/places', googlePlacesRoutes);
router.use('/notifications', notificationRoutes);

export default router;
