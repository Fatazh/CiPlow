import { createError, getRequestIP, setResponseHeader, type H3Event } from "h3";

type RateLimitOptions = {
  key: string;
  max: number;
  windowMs: number;
  message?: string;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 10000;

function pruneBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  if (buckets.size <= MAX_BUCKETS) {
    return;
  }

  const entries = Array.from(buckets.entries()).sort(
    (a, b) => a[1].resetAt - b[1].resetAt,
  );

  for (const [key] of entries.slice(0, buckets.size - MAX_BUCKETS)) {
    buckets.delete(key);
  }
}

export function assertRateLimit(event: H3Event, options: RateLimitOptions) {
  const now = Date.now();
  pruneBuckets(now);

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  const bucketKey = `${options.key}:${ip}`;
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return;
  }

  if (existing.count >= options.max) {
    setResponseHeader(
      event,
      "Retry-After",
      Math.max(1, Math.ceil((existing.resetAt - now) / 1000)).toString(),
    );

    throw createError({
      statusCode: 429,
      message:
        options.message ?? "Terlalu banyak percobaan. Coba lagi beberapa saat.",
    });
  }

  existing.count += 1;
}
