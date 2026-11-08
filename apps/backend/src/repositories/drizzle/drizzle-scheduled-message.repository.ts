import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, and, lte } from "drizzle-orm";
import { ScheduledMessageRepository } from "../interfaces";
import { ScheduledMessage } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleScheduledMessageRepository
  implements ScheduledMessageRepository
{
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<ScheduledMessage | null> {
    const results = await this.db
      .select()
      .from(schema.scheduledMessages)
      .where(eq(schema.scheduledMessages.id, id))
      .limit(1);

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async findAllByUserId(userId: string): Promise<ScheduledMessage[]> {
    const results = await this.db
      .select()
      .from(schema.scheduledMessages)
      .where(eq(schema.scheduledMessages.userId, userId));

    return results.map((r) => this.mapToEntity(r));
  }

  async findDuePending(): Promise<ScheduledMessage[]> {
    const now = new Date();
    const results = await this.db
      .select()
      .from(schema.scheduledMessages)
      .where(
        and(
          eq(schema.scheduledMessages.status, "pending"),
          lte(schema.scheduledMessages.scheduledAt, now),
        ),
      );

    return results.map((r) => this.mapToEntity(r));
  }

  async save(entity: ScheduledMessage): Promise<ScheduledMessage> {
    const results = await this.db
      .insert(schema.scheduledMessages)
      .values({
        id: entity.id,
        userId: entity.userId,
        sessionId: entity.sessionId,
        to: entity.to,
        type: entity.type,
        content: entity.content,
        mediaUrl: entity.mediaUrl ?? null,
        scheduledAt: new Date(entity.scheduledAt),
        status: entity.status,
        messageId: entity.messageId ?? null,
        errorMessage: entity.errorMessage ?? null,
      })
      .returning();

    return this.mapToEntity(results[0]);
  }

  async update(
    id: string,
    partial: Partial<ScheduledMessage>,
  ): Promise<ScheduledMessage | null> {
    const updateValues: Record<string, unknown> = {};
    if (partial.status !== undefined) updateValues.status = partial.status;
    if (partial.messageId !== undefined) updateValues.messageId = partial.messageId;
    if (partial.errorMessage !== undefined)
      updateValues.errorMessage = partial.errorMessage;
    if (partial.scheduledAt !== undefined)
      updateValues.scheduledAt = new Date(partial.scheduledAt);
    if (partial.content !== undefined) updateValues.content = partial.content;
    if (partial.mediaUrl !== undefined) updateValues.mediaUrl = partial.mediaUrl;

    const results = await this.db
      .update(schema.scheduledMessages)
      .set(updateValues)
      .where(eq(schema.scheduledMessages.id, id))
      .returning();

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(schema.scheduledMessages)
      .where(eq(schema.scheduledMessages.id, id));
  }

  private mapToEntity(
    raw: typeof schema.scheduledMessages.$inferSelect,
  ): ScheduledMessage {
    return {
      id: raw.id,
      userId: raw.userId,
      sessionId: raw.sessionId,
      to: raw.to,
      type: raw.type as ScheduledMessage["type"],
      content: raw.content,
      mediaUrl: raw.mediaUrl ?? undefined,
      scheduledAt: raw.scheduledAt.toISOString(),
      status: raw.status as ScheduledMessage["status"],
      messageId: raw.messageId ?? undefined,
      errorMessage: raw.errorMessage ?? undefined,
      createdAt: raw.createdAt.toISOString(),
    };
  }
}
