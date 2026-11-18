import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from "@nestjs/common";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { v4 as uuidv4 } from "uuid";

interface WindowEntry {
  count: number;
  windowStart: number;
}

/**
 * Hybrid rate limiter per API key:
 * - In-memory sliding window counters for microsecond-fast gating.
 * - Asynchronous persistence to PostgreSQL RateLimitCounter table for auditing & persistence.
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

  constructor(
    @Optional()
    @Inject(DRIZZLE_CLIENT)
    private readonly db?: NodePgDatabase<typeof schema>,
  ) {}

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

    // Asynchronously log to PostgreSQL RateLimitCounter table
    if (this.db) {
      void this.db
        .insert(schema.rateLimitCounters)
        .values({
          id: uuidv4(),
          apiKeyId: key,
          windowStart: new Date(entry.windowStart),
          windowType: type,
          count: entry.count,
        })
        .catch(() => {});
    }
  }
}
