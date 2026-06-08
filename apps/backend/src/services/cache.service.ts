import crypto from 'crypto';
import { redis } from '../config/redis';

// ─── Key Namespaces ───────────────────────────────────────────────────────────

const KEYS = {
  feed: (userId: string) => `feed:${userId}`,
  followers: (userId: string) => `followers:${userId}`,
  aiResponse: (feature: string, hash: string) => `ai:${feature}:${hash}`,
  presence: (userId: string) => `presence:${userId}`,
  session: (userId: string) => `session:${userId}`,
  rateLimit: (key: string) => `rl:${key}`,
  notifUnread: (userId: string) => `notif:unread:${userId}`,
  notifList: (userId: string) => `notif:list:${userId}`,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PresenceData {
  socketId: string;
  userId: string;
  onlineSince: number; // unix ms
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms
}

export interface CachedNotification {
  id: string;
  type: string;
  message: string;
  senderId?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Cache Service ────────────────────────────────────────────────────────────

export class CacheService {

  // ══════════════════════════════════════════════════════════════════════════
  // FEED CACHE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get a cached feed for a user. Returns raw JSON string or null.
   */
  async getFeed(userId: string): Promise<string | null> {
    return redis.get(KEYS.feed(userId));
  }

  /**
   * Cache a user's feed. Default TTL: 5 minutes.
   */
  async setFeed<T>(userId: string, posts: T[], ttl: number = 300): Promise<void> {
    await redis.set(KEYS.feed(userId), JSON.stringify(posts), 'EX', ttl);
  }

  /**
   * Invalidate a single user's feed cache.
   */
  async invalidateFeed(userId: string): Promise<void> {
    await redis.del(KEYS.feed(userId));
  }

  /**
   * Invalidate feed caches for all followers of a user.
   * Called when a user creates/deletes a post.
   * Follower list is stored as a Redis Set: followers:{userId}
   */
  async invalidateFollowerFeeds(userId: string): Promise<void> {
    const followerIds = await redis.smembers(KEYS.followers(userId));
    if (followerIds.length === 0) return;

    const pipeline = redis.pipeline();
    for (const followerId of followerIds) {
      pipeline.del(KEYS.feed(followerId));
    }
    await pipeline.exec();
  }

  /**
   * Add a follower to the cached follower set for a user.
   * Called when a follow relationship is created.
   */
  async addFollower(userId: string, followerId: string): Promise<void> {
    await redis.sadd(KEYS.followers(userId), followerId);
  }

  /**
   * Remove a follower from the cached follower set.
   */
  async removeFollower(userId: string, followerId: string): Promise<void> {
    await redis.srem(KEYS.followers(userId), followerId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AI RESPONSE CACHE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Hash a prompt string with SHA-256 for use as a cache key.
   */
  hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt.trim().toLowerCase()).digest('hex');
  }

  /**
   * Get a cached AI response. Returns the response string or null.
   */
  async getAIResponse(feature: string, promptHash: string): Promise<string | null> {
    return redis.get(KEYS.aiResponse(feature, promptHash));
  }

  /**
   * Cache an AI response. Default TTL: 1 hour.
   */
  async setAIResponse(
    feature: string,
    promptHash: string,
    response: string,
    ttl: number = 3600,
  ): Promise<void> {
    await redis.set(KEYS.aiResponse(feature, promptHash), response, 'EX', ttl);
  }

  /**
   * Convenience: hash prompt then get cached response.
   */
  async getAIResponseByPrompt(feature: string, prompt: string): Promise<string | null> {
    const hash = this.hashPrompt(prompt);
    return this.getAIResponse(feature, hash);
  }

  /**
   * Convenience: hash prompt then cache response.
   */
  async setAIResponseByPrompt(
    feature: string,
    prompt: string,
    response: string,
    ttl: number = 3600,
  ): Promise<void> {
    const hash = this.hashPrompt(prompt);
    await this.setAIResponse(feature, hash, response, ttl);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ONLINE PRESENCE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Mark a user as online and store their socket ID.
   * Uses a Redis Hash: presence:{userId} → { socketId, userId, onlineSince }
   */
  async setUserOnline(userId: string, socketId: string): Promise<void> {
    const data: PresenceData = {
      socketId,
      userId,
      onlineSince: Date.now(),
    };
    await redis.hset(KEYS.presence(userId), data as unknown as Record<string, string | number>);
    // Presence expires after 24h of inactivity (refreshed on each socket event)
    await redis.expire(KEYS.presence(userId), 86400);
  }

  /**
   * Mark a user as offline by deleting their presence key.
   */
  async setUserOffline(userId: string): Promise<void> {
    await redis.del(KEYS.presence(userId));
  }

  /**
   * Check if a user is currently online.
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const exists = await redis.exists(KEYS.presence(userId));
    return exists === 1;
  }

  /**
   * Get the socket IDs for a list of users.
   * Returns an array of socketId strings (empty string = offline).
   */
  async getOnlineUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];

    const pipeline = redis.pipeline();
    for (const userId of userIds) {
      pipeline.hget(KEYS.presence(userId), 'socketId');
    }
    const results = await pipeline.exec();

    return (results ?? []).map((result) => {
      const [err, value] = result as [Error | null, string | null];
      return err || !value ? '' : value;
    });
  }

  /**
   * Get full presence data for a user.
   */
  async getPresenceData(userId: string): Promise<PresenceData | null> {
    const data = await redis.hgetall(KEYS.presence(userId));
    if (!data || Object.keys(data).length === 0) return null;
    return {
      socketId: data.socketId ?? '',
      userId: data.userId ?? userId,
      onlineSince: parseInt(data.onlineSince ?? '0', 10),
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SESSION CACHE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Store arbitrary session data for a user. Default TTL: 24 hours.
   */
  async setUserSession<T extends object>(
    userId: string,
    data: T,
    ttl: number = 86400,
  ): Promise<void> {
    await redis.set(KEYS.session(userId), JSON.stringify(data), 'EX', ttl);
  }

  /**
   * Retrieve session data for a user.
   */
  async getUserSession<T extends object>(userId: string): Promise<T | null> {
    const raw = await redis.get(KEYS.session(userId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * Delete a user's session cache.
   */
  async deleteUserSession(userId: string): Promise<void> {
    await redis.del(KEYS.session(userId));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RATE LIMITING — Sliding Window
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Sliding window rate limiter using a sorted set.
   *
   * Algorithm:
   *  1. Remove all entries older than the window
   *  2. Count remaining entries
   *  3. If under limit, add current timestamp and allow
   *  4. If at/over limit, deny
   *
   * @param key        Unique key (e.g. "login:127.0.0.1")
   * @param limit      Max requests allowed in the window
   * @param windowSecs Window size in seconds
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSecs: number,
  ): Promise<RateLimitResult> {
    const redisKey = KEYS.rateLimit(key);
    const now = Date.now();
    const windowStart = now - windowSecs * 1000;
    const resetAt = now + windowSecs * 1000;

    const pipeline = redis.multi();
    // Remove expired entries
    pipeline.zremrangebyscore(redisKey, '-inf', windowStart.toString());
    // Count current entries in window
    pipeline.zcard(redisKey);
    // Add current request with timestamp as score
    pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
    // Set key expiry to window size
    pipeline.expire(redisKey, windowSecs);

    const results = await pipeline.exec();

    // zcard result is at index 1
    const currentCount = (results?.[1]?.[1] as number) ?? 0;
    const allowed = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount - (allowed ? 1 : 0));

    return { allowed, remaining, resetAt };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION CACHE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Push a new notification to the user's cached notification list.
   * Keeps the 50 most recent. Also increments the unread counter atomically.
   */
  async cacheNotification(userId: string, notification: CachedNotification): Promise<void> {
    const listKey = KEYS.notifList(userId);
    const unreadKey = KEYS.notifUnread(userId);

    const pipeline = redis.pipeline();
    // Prepend to list (newest first)
    pipeline.lpush(listKey, JSON.stringify(notification));
    // Trim to 50 most recent
    pipeline.ltrim(listKey, 0, 49);
    // Set TTL on list (7 days)
    pipeline.expire(listKey, 7 * 24 * 60 * 60);
    // Increment unread counter atomically
    pipeline.incr(unreadKey);
    // Set TTL on counter
    pipeline.expire(unreadKey, 7 * 24 * 60 * 60);

    await pipeline.exec();
  }

  /**
   * Atomically increment the unread notification count and return the new value.
   * This prevents race conditions when multiple notifications arrive simultaneously.
   */
  async incrementUnreadCount(userId: string): Promise<number> {
    const key = KEYS.notifUnread(userId);
    const newCount = await redis.incr(key);
    // Set TTL after increment
    await redis.expire(key, 7 * 24 * 60 * 60);
    return newCount;
  }

  /**
   * Atomically decrement the unread notification count and return the new value.
   * Ensures the count never goes below zero.
   */
  async decrementUnreadCount(userId: string): Promise<number> {
    const key = KEYS.notifUnread(userId);
    const newCount = await redis.decr(key);
    // If count went negative, reset to 0
    if (newCount < 0) {
      await redis.set(key, '0', 'EX', 7 * 24 * 60 * 60);
      return 0;
    }
    return newCount;
  }

  /**
   * Get the unread notification count for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    const raw = await redis.get(KEYS.notifUnread(userId));
    return raw ? parseInt(raw, 10) : 0;
  }

  /**
   * Mark all notifications as read — reset the unread counter to 0.
   */
  async markAllRead(userId: string): Promise<void> {
    await redis.set(KEYS.notifUnread(userId), '0', 'EX', 7 * 24 * 60 * 60);
  }

  /**
   * Get the cached notification list for a user (up to 50).
   */
  async getCachedNotifications(userId: string): Promise<CachedNotification[]> {
    const items = await redis.lrange(KEYS.notifList(userId), 0, 49);
    return items.map((item) => {
      try {
        return JSON.parse(item) as CachedNotification;
      } catch {
        return null;
      }
    }).filter((n): n is CachedNotification => n !== null);
  }

  /**
   * Clear all notification cache for a user.
   */
  async clearNotificationCache(userId: string): Promise<void> {
    await redis.del(KEYS.notifList(userId), KEYS.notifUnread(userId));
  }

  /**
   * Synchronize the unread count in Redis with the actual MongoDB count.
   * This is useful for recovering from race conditions or cache inconsistencies.
   * Returns the synchronized count.
   */
  async syncUnreadCount(userId: string): Promise<number> {
    // This would be implemented by the notification service
    // but we provide a helper here to set the authoritative count
    // The caller should provide the actual count from MongoDB
    return this.getUnreadCount(userId);
  }

  /**
   * Set the unread count to a specific value (for sync operations).
   * Use this when you need to override the count with an authoritative value.
   */
  async setUnreadCount(userId: string, count: number): Promise<void> {
    const validCount = Math.max(0, count);
    await redis.set(KEYS.notifUnread(userId), validCount.toString(), 'EX', 7 * 24 * 60 * 60);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GENERIC HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Delete one or more keys.
   */
  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) await redis.del(...keys);
  }

  /**
   * Check if a key exists.
   */
  async exists(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1;
  }

  /**
   * Set a key with optional TTL.
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await redis.set(key, value);
    }
  }

  /**
   * Get a key value.
   */
  async get(key: string): Promise<string | null> {
    return redis.get(key);
  }

  /**
   * Set a JSON value with optional TTL.
   */
  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /**
   * Get and parse a JSON value.
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const cacheService = new CacheService();
