import Redis from 'ioredis';
import { env } from './env';

const createRedisClient = (): Redis => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times: number): number | null {
      if (times > 10) {
        console.error('❌ Redis max retries reached. Giving up.');
        return null; // stop retrying
      }
      const delay = Math.min(times * 200, 2000);
      console.log(`🔄 Redis reconnecting in ${delay}ms (attempt ${times})...`);
      return delay;
    },
    reconnectOnError(err: Error): boolean {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  client.on('connect', () => console.log('✅ Redis client connected'));
  client.on('ready', () => console.log('📦 Redis client ready'));
  client.on('error', (err: Error) => console.error('❌ Redis client error:', err));
  client.on('close', () => console.warn('⚠️  Redis connection closed'));
  client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
  client.on('end', () => console.warn('🔌 Redis connection ended'));

  return client;
};

export const redis = createRedisClient();

// ─── Helper Methods ───────────────────────────────────────────────────────────

export const redisGet = async (key: string): Promise<string | null> => {
  return redis.get(key);
};

export const redisSet = async (
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<void> => {
  if (ttlSeconds !== undefined) {
    await redis.set(key, value, 'EX', ttlSeconds);
  } else {
    await redis.set(key, value);
  }
};

export const redisDel = async (...keys: string[]): Promise<number> => {
  return redis.del(...keys);
};

export const redisExists = async (key: string): Promise<boolean> => {
  const result = await redis.exists(key);
  return result === 1;
};

export const redisSetJSON = async <T>(
  key: string,
  value: T,
  ttlSeconds?: number,
): Promise<void> => {
  await redisSet(key, JSON.stringify(value), ttlSeconds);
};

export const redisGetJSON = async <T>(key: string): Promise<T | null> => {
  const raw = await redisGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};
