import { Injectable, HttpException, HttpStatus } from "@nestjs/common";

interface WindowEntry {
  count: number;
  windowStart: number;
}

/**
 * In-memory rate limiter per API key.
 * Uses sliding window counters stored in a Map.
 * For production, replace with Redis.
 */
@Injectable()
export class RateLimitService {
  // Default limits — can be overridden per key
  private readonly MINUTE_LIMIT = parseInt(
    process.env.RATE_LIMIT_PER_MINUTE ?? "60",
    10,
  );
  private readonly HOUR_LIMIT = parseInt(
    process.env.RATE_LIMIT_PER_HOUR ?? "1000",
    10,
  );

  private minuteWindows = new Map<string, WindowEntry>();
  private hourWindows = new Map<string, WindowEntry>();

  async check(apiKeyId: string): Promise<void> {
    const now = Date.now();
    this.checkWindow(
      apiKeyId,
      now,
      "minute",
      60_000,
      this.MINUTE_LIMIT,
      this.minuteWindows,
    );
    this.checkWindow(
      apiKeyId,
      now,
      "hour",
      3_600_000,
      this.HOUR_LIMIT,
      this.hourWindows,
    );
  }

  getUsage(apiKeyId: string): { minute: number; hour: number } {
    const now = Date.now();
    const min = this.minuteWindows.get(apiKeyId);
    const hr = this.hourWindows.get(apiKeyId);
    return {
      minute: min && now - min.windowStart < 60_000 ? min.count : 0,
      hour: hr && now - hr.windowStart < 3_600_000 ? hr.count : 0,
    };
  }

  private checkWindow(
    key: string,
    now: number,
    type: string,
    windowMs: number,
    limit: number,
    store: Map<string, WindowEntry>,
  ): void {
    const entry = store.get(key);
    if (!entry || now - entry.windowStart >= windowMs) {
      store.set(key, { count: 1, windowStart: now });
      return;
    }
    if (entry.count >= limit) {
      const resetIn = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      throw new HttpException(
        `Rate limit exceeded (${limit} per ${type}). Retry in ${resetIn}s.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    entry.count++;
  }
}
