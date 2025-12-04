import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter that allows 5 requests per 60 seconds
// This is strict for login endpoints to prevent brute force
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "@mindnamo/admin/auth",
});

export async function limitKey(key) {
  // Graceful fallback if Upstash env vars are not set (prevents build crashes)
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("⚠️ Upstash Redis credentials missing. Rate limiting is DISABLED.");
    return { success: true };
  }

  try {
    const { success, reset } = await ratelimit.limit(key);
    return { success, reset };
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open (allow traffic) so users aren't blocked if Redis goes down
    return { success: true };
  }
}