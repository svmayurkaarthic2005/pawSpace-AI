import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';

import { env } from './config/env';
import { connectDB } from './config/db';
import { redis } from './config/redis';
import { httpLogger } from './middleware/logger';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/error';
import { sanitizeInput } from './middleware/sanitize';
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import petRoutes from './routes/pet.routes';
import followRoutes from './routes/follow.routes';
import userRoutes from './routes/user.routes';
import chatRoutes from './routes/chat.routes';
import aiRoutes from './routes/ai.routes';
import eventRoutes from './routes/event.routes';
import communityRoutes from './routes/community.routes';
import discoveryRoutes from './routes/discovery.routes';
import googlePlacesRoutes from './routes/googlePlaces.routes';
import exploreRoutes from './routes/explore.routes';
import notificationRoutes from './routes/notification.routes';
import mapRoutes from './routes/map.routes';
import agoraRoutes from './routes/agora.routes';
import { createSocketServer, setIO } from './socket/socket';

// ─── App Setup ────────────────────────────────────────────────────────────────

const app: Application = express();
const httpServer = http.createServer(app);

// Disable ETags for API responses (mobile apps expect JSON every time, not 304)
app.disable('etag');

// ─── Socket.IO ────────────────────────────────────────────────────────────────

export const io = createSocketServer(httpServer);
setIO(io); // Store instance for getIO() access

// ─── Security Headers ─────────────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
  }),
);

// ─── CORS ─────────────────────────────────────────────────────────────────────

const allowedOrigins =
  env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean)
    : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'],
    credentials: true,
  }),
);

// ─── Request Parsing (tighter limits in production) ───────────────────────────

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ─── Input Sanitization ───────────────────────────────────────────────────────

app.use(sanitizeInput);

// ─── Logging ──────────────────────────────────────────────────────────────────

app.use(httpLogger);

// ─── Rate Limiting ────────────────────────────────────────────────────────────

app.use('/api', apiLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', async (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  let redisStatus = 'disconnected';
  try {
    await redis.ping();
    redisStatus = 'connected';
  } catch {
    redisStatus = 'error';
  }

  const healthy = dbStatus === 'connected' && redisStatus === 'connected';
  
  // Check service configurations
  const googleMapsConfigured = !!(env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY.length > 20);
  const googleMapsIsPlaceholder = env.GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here';
  
  const warnings: string[] = [];
  if (!googleMapsConfigured || googleMapsIsPlaceholder) {
    warnings.push('⚠️  Google Maps API not configured - event creation will fail');
  }

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'healthy' : 'degraded',
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
      googleMaps: googleMapsConfigured && !googleMapsIsPlaceholder ? 'configured' : 'not_configured',
      cloudinary: env.CLOUDINARY_API_KEY ? 'configured' : 'not_configured',
      firebase: env.FIREBASE_PROJECT_ID ? 'configured' : 'not_configured',
      groq: env.GEMINI_API_KEY ? 'configured' : 'not_configured',
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  });
});

// ─── Ping (Cron keep-alive) ───────────────────────────────────────────────────

app.get('/ping', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// ─── FCM Token Update ─────────────────────────────────────────────────────────

import { authenticate } from './middleware/auth';
import { fcmService } from './services/fcm.service';
import { successResponse } from './utils';

app.post('/api/v1/users/fcm-token', authenticate, async (req: Request, res: Response, next) => {
  try {
    const { token } = req.body as { token: string };
    if (!token || !req.user) {
      res.status(400).json({ success: false, message: 'Token required' });
      return;
    }
    await fcmService.updateToken(req.user.userId, token);
    res.status(200).json(successResponse(null, 'FCM token updated'));
  } catch (err) {
    next(err);
  }
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/pets', petRoutes);
app.use('/api/v1/follows', followRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/communities', communityRoutes);
app.use('/api/v1/google-places', googlePlacesRoutes);
app.use('/api/v1/explore', exploreRoutes);
app.use('/api/v1/search', exploreRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/map', mapRoutes);
app.use('/api/v1/agora', agoraRoutes);
app.use('/api/v1', discoveryRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const bootstrap = async (): Promise<void> => {
  try {
    await connectDB();
    await redis.ping();
    console.log('✅ Redis ping successful');

    // Handle listen errors (EADDRINUSE happens asynchronously, so catch it here)
    httpServer.on('error', (err: any) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`💥 Port ${env.PORT} already in use. Free the port or set a different PORT env var.`);
        process.exit(1);
      }
      console.error('💥 HTTP server error:', err);
      process.exit(1);
    });

    httpServer.listen(env.PORT, '0.0.0.0', () => {
      console.log(`🚀 PawSpace API running on port ${env.PORT} [${env.NODE_ENV}]`);
      console.log(`🔗 Health: http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    console.error('💀 Failed to start server:', error);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n📴 ${signal} received. Shutting down...`);
  httpServer.close(async () => {
    await mongoose.connection.close();
    await redis.quit();
    console.log('🔌 All connections closed');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  process.exit(1);
});
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

void bootstrap();

export default app;
