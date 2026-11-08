import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { UsageRepository } from "../interfaces";
import { UsageRecord } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleUsageRepository implements UsageRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findByUserAndMonth(
    userId: string,
    month: string,
  ): Promise<UsageRecord | null> {
    const results = await this.db
      .select()
      .from(schema.usageRecords)
      .where(
        and(
          eq(schema.usageRecords.userId, userId),
          eq(schema.usageRecords.month, month),
        ),
      )
      .limit(1);

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async findAllByUserId(userId: string): Promise<UsageRecord[]> {
    const results = await this.db
      .select()
      .from(schema.usageRecords)
      .where(eq(schema.usageRecords.userId, userId));

    return results.map((r) => this.mapToEntity(r));
  }

  async upsert(
    userId: string,
    month: string,
    delta: { sent?: number; received?: number },
  ): Promise<UsageRecord> {
    const existing = await this.findByUserAndMonth(userId, month);

    if (existing) {
      const results = await this.db
        .update(schema.usageRecords)
        .set({
          messagesSent: sql`${schema.usageRecords.messagesSent} + ${delta.sent ?? 0}`,
          messagesReceived: sql`${schema.usageRecords.messagesReceived} + ${delta.received ?? 0}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.usageRecords.id, existing.id))
        .returning();

      return this.mapToEntity(results[0]);
    } else {
      const results = await this.db
        .insert(schema.usageRecords)
        .values({
          id: uuidv4(),
          userId,
          month,
          messagesSent: delta.sent ?? 0,
          messagesReceived: delta.received ?? 0,
          quotaLimit: 1000,
        })
        .returning();

      return this.mapToEntity(results[0]);
    }
  }

  private mapToEntity(
    raw: typeof schema.usageRecords.$inferSelect,
  ): UsageRecord {
    return {
      id: raw.id,
      userId: raw.userId,
      month: raw.month,
      messagesSent: raw.messagesSent,
      messagesReceived: raw.messagesReceived,
      quotaLimit: raw.quotaLimit,
      updatedAt: raw.updatedAt.toISOString(),
    };
  }
}
