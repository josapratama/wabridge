import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, desc } from "drizzle-orm";
import { BroadcastJobRepository } from "../interfaces";
import { BroadcastJob } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleBroadcastJobRepository implements BroadcastJobRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<BroadcastJob | null> {
    const results = await this.db
      .select()
      .from(schema.broadcastJobs)
      .where(eq(schema.broadcastJobs.id, id))
      .limit(1);

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async findAllByUserId(userId: string): Promise<BroadcastJob[]> {
    const results = await this.db
      .select()
      .from(schema.broadcastJobs)
      .where(eq(schema.broadcastJobs.userId, userId))
      .orderBy(desc(schema.broadcastJobs.createdAt));

    return results.map((r) => this.mapToEntity(r));
  }

  async save(entity: BroadcastJob): Promise<BroadcastJob> {
    const results = await this.db
      .insert(schema.broadcastJobs)
      .values({
        id: entity.id,
        userId: entity.userId,
        sessionId: entity.sessionId,
        name: entity.name,
        content: entity.content,
        recipients: entity.recipients,
        delayMs: entity.delayMs,
        status: entity.status,
        totalCount: entity.totalCount,
        sentCount: entity.sentCount,
        failedCount: entity.failedCount,
        startedAt: entity.startedAt ? new Date(entity.startedAt) : null,
        completedAt: entity.completedAt ? new Date(entity.completedAt) : null,
      })
      .returning();

    return this.mapToEntity(results[0]);
  }

  async update(
    id: string,
    partial: Partial<BroadcastJob>,
  ): Promise<BroadcastJob | null> {
    const updateValues: Record<string, unknown> = {};
    if (partial.status !== undefined) updateValues.status = partial.status;
    if (partial.sentCount !== undefined) updateValues.sentCount = partial.sentCount;
    if (partial.failedCount !== undefined)
      updateValues.failedCount = partial.failedCount;
    if (partial.startedAt !== undefined)
      updateValues.startedAt = partial.startedAt ? new Date(partial.startedAt) : null;
    if (partial.completedAt !== undefined)
      updateValues.completedAt = partial.completedAt
        ? new Date(partial.completedAt)
        : null;

    const results = await this.db
      .update(schema.broadcastJobs)
      .set(updateValues)
      .where(eq(schema.broadcastJobs.id, id))
      .returning();

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  private mapToEntity(
    raw: typeof schema.broadcastJobs.$inferSelect,
  ): BroadcastJob {
    return {
      id: raw.id,
      userId: raw.userId,
      sessionId: raw.sessionId,
      name: raw.name,
      content: raw.content,
      recipients: raw.recipients as string[],
      delayMs: raw.delayMs,
      status: raw.status as BroadcastJob["status"],
      totalCount: raw.totalCount,
      sentCount: raw.sentCount,
      failedCount: raw.failedCount,
      startedAt: raw.startedAt?.toISOString(),
      completedAt: raw.completedAt?.toISOString(),
      createdAt: raw.createdAt.toISOString(),
    };
  }
}
