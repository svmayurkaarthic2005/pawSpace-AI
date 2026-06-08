import mongoose from 'mongoose';
import { env } from './env';

const MAX_RETRIES = 20;
const RETRY_INTERVAL_MS = 8000;

let retryCount = 0;

const connectWithRetry = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    retryCount = 0;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    retryCount += 1;
    console.error(`❌ MongoDB connection failed (attempt ${retryCount}/${MAX_RETRIES}):`, error);

    if (retryCount >= MAX_RETRIES) {
      console.error('💀 Max MongoDB connection retries reached. Exiting.');
      process.exit(1);
    }

    console.log(`🔄 Retrying MongoDB connection in ${RETRY_INTERVAL_MS / 1000}s...`);
    setTimeout(connectWithRetry, RETRY_INTERVAL_MS);
  }
};

export const connectDB = async (): Promise<void> => {
  mongoose.connection.on('connected', () => {
    console.log('📦 Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err: Error) => {
    console.error('❌ Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  Mongoose disconnected from MongoDB');
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed due to app termination');
    process.exit(0);
  });

  await connectWithRetry();
};
