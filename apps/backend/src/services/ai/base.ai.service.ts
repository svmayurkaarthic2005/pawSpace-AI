import Groq from 'groq-sdk';
import crypto from 'crypto';
import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { AIInteraction, AIFeature } from '../../models/aiInteraction.model';
import { AppError } from '../../middleware/error';

// ─── Models ───────────────────────────────────────────────────────────────────

export const AI_MODELS = {
  FAST: 'llama3-8b-8192',
  SMART: 'llama3-70b-8192',
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: false;
}

export interface StreamOptions {
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
}

export interface AICallResult {
  text: string;
  tokensUsed: number;
  latencyMs: number;
  cached: boolean;
  modelName: string;
}

// ─── Rate limit keys ──────────────────────────────────────────────────────────

const RL_USER_KEY = (userId: string) => `ai_rl:user:${userId}`;
const RL_GLOBAL_KEY = 'ai_rl:global';
const RL_USER_LIMIT = 20;
const RL_GLOBAL_LIMIT = 100;
const RL_WINDOW_SECS = 60;

// ─── Base AI Service ──────────────────────────────────────────────────────────

export abstract class BaseAIService {
  protected readonly groq: Groq;
  protected abstract readonly feature: AIFeature;
  protected abstract readonly fallbackResponse: string;

  constructor() {
    this.groq = new Groq({ apiKey: env.GROQ_API_KEY });
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────

  protected async checkRateLimit(userId: string): Promise<void> {
    const now = Date.now();
    const windowStart = now - RL_WINDOW_SECS * 1000;

    const pipeline = redis.multi();

    // User rate limit
    pipeline.zremrangebyscore(RL_USER_KEY(userId), '-inf', windowStart.toString());
    pipeline.zcard(RL_USER_KEY(userId));
    pipeline.zadd(RL_USER_KEY(userId), now, `${now}-${Math.random()}`);
    pipeline.expire(RL_USER_KEY(userId), RL_WINDOW_SECS);

    // Global rate limit
    pipeline.zremrangebyscore(RL_GLOBAL_KEY, '-inf', windowStart.toString());
    pipeline.zcard(RL_GLOBAL_KEY);
    pipeline.zadd(RL_GLOBAL_KEY, now, `${now}-${Math.random()}`);
    pipeline.expire(RL_GLOBAL_KEY, RL_WINDOW_SECS);

    const results = await pipeline.exec();

    const userCount = (results?.[1]?.[1] as number) ?? 0;
    const globalCount = (results?.[5]?.[1] as number) ?? 0;

    if (userCount >= RL_USER_LIMIT) {
      throw new AppError(
        `AI rate limit exceeded. You can make ${RL_USER_LIMIT} AI requests per minute.`,
        429,
        true,
        'AI_RATE_LIMIT',
      );
    }

    if (globalCount >= RL_GLOBAL_LIMIT) {
      throw new AppError(
        'AI service is temporarily busy. Please try again in a moment.',
        429,
        true,
        'AI_GLOBAL_RATE_LIMIT',
      );
    }
  }

  // ── Cache helpers ──────────────────────────────────────────────────────────

  protected hashPrompt(messages: ChatMessage[]): string {
    const key = messages.map((m) => `${m.role}:${m.content}`).join('|');
    return crypto.createHash('sha256').update(key.trim().toLowerCase()).digest('hex');
  }

  protected async getCached(hash: string): Promise<string | null> {
    return redis.get(`ai:${this.feature}:${hash}`);
  }

  protected async setCached(hash: string, response: string, ttl = 3600): Promise<void> {
    await redis.set(`ai:${this.feature}:${hash}`, response, 'EX', ttl);
  }

  // ── Logging ────────────────────────────────────────────────────────────────

  protected async logInteraction(
    userId: string,
    prompt: string,
    response: string,
    modelName: string,
    tokensUsed: number,
    latencyMs: number,
    cached: boolean,
  ): Promise<void> {
    try {
      await AIInteraction.create({
        user: userId,
        feature: this.feature,
        prompt: prompt.slice(0, 10000),
        response: response.slice(0, 20000),
        modelName,
        tokensUsed,
        latencyMs,
        cached,
      });
    } catch {
      // Non-critical — don't fail the request if logging fails
    }
  }

  // ── Complete (non-streaming) ───────────────────────────────────────────────

  async complete(
    userId: string,
    messages: ChatMessage[],
    options: CompletionOptions = {},
  ): Promise<AICallResult> {
    await this.checkRateLimit(userId);

    const {
      model = AI_MODELS.SMART,
      temperature = 0.7,
      maxTokens = 1024,
      topP = 1,
    } = options;

    const promptHash = this.hashPrompt(messages);

    // Cache check
    const cached = await this.getCached(promptHash);
    if (cached) {
      void this.logInteraction(userId, messages[messages.length - 1]?.content ?? '', cached, model, 0, 0, true);
      return { text: cached, tokensUsed: 0, latencyMs: 0, cached: true, modelName: model };
    }

    const start = Date.now();

    try {
      const completion = await this.groq.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        stream: false,
      });

      const latencyMs = Date.now() - start;
      const text = completion.choices[0]?.message?.content ?? this.fallbackResponse;
      const tokensUsed = completion.usage?.total_tokens ?? 0;

      // Cache successful response
      await this.setCached(promptHash, text);

      void this.logInteraction(
        userId,
        messages[messages.length - 1]?.content ?? '',
        text,
        model,
        tokensUsed,
        latencyMs,
        false,
      );

      return { text, tokensUsed, latencyMs, cached: false, modelName: model };
    } catch (err) {
      console.error(`[AI:${this.feature}] Groq error:`, err);
      return {
        text: this.fallbackResponse,
        tokensUsed: 0,
        latencyMs: Date.now() - start,
        cached: false,
        modelName: model,
      };
    }
  }

  // ── Stream ─────────────────────────────────────────────────────────────────

  async *stream(
    userId: string,
    messages: ChatMessage[],
    options: StreamOptions = {},
  ): AsyncGenerator<string> {
    await this.checkRateLimit(userId);

    const { model = AI_MODELS.SMART, temperature = 0.7, maxTokens = 1024 } = options;

    try {
      const streamResponse = await this.groq.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      let fullText = '';
      for await (const chunk of streamResponse) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) {
          fullText += delta;
          yield delta;
        }
      }

      // Cache the full streamed response
      if (fullText) {
        const hash = this.hashPrompt(messages);
        await this.setCached(hash, fullText);
        void this.logInteraction(userId, messages[messages.length - 1]?.content ?? '', fullText, model, 0, 0, false);
      }
    } catch (err) {
      console.error(`[AI:${this.feature}] Stream error:`, err);
      yield this.fallbackResponse;
    }
  }

  // ── Usage stats ────────────────────────────────────────────────────────────

  async getUsageStats(userId: string): Promise<{
    feature: AIFeature;
    count: number;
    totalTokens: number;
    cachedCount: number;
  }[]> {
    const stats = await AIInteraction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$feature',
          count: { $sum: 1 },
          totalTokens: { $sum: '$tokensUsed' },
          cachedCount: { $sum: { $cond: ['$cached', 1, 0] } },
        },
      },
    ]);

    return stats.map((s) => ({
      feature: s._id as AIFeature,
      count: s.count as number,
      totalTokens: s.totalTokens as number,
      cachedCount: s.cachedCount as number,
    }));
  }
}
