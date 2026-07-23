import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';
import { ApiError } from '@/lib/errors';

const limiter =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN }),
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        prefix: 'pivot:ai',
      })
    : null;

/** 10 req/min/user on AI routes. No-op when Upstash is not configured (dev). */
export async function enforceRateLimit(userId: string) {
  if (!limiter) return;
  const { success } = await limiter.limit(userId);
  if (!success) throw new ApiError('rate_limited', 'Too many requests — slow down a little.', 429);
}
