import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, or, desc } from "drizzle-orm";
import { MessageRepository } from "../interfaces";
import { Message } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleMessageRepository implements MessageRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<Message | null> {
    const results = await this.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.id, id))
      .limit(1);

    if (results.length === 0) return null;
    const message = results[0];
    return {
      ...message,
      externalMessageId: message.externalMessageId || undefined,
      rawPayload: (message.rawPayload as Record<string, unknown>) || undefined,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    } as Message;
  }

  async findBySessionId(sessionId: string): Promise<Message[]> {
    const results = await this.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.sessionId, sessionId));

    return results.map((m) => ({
      ...m,
      externalMessageId: m.externalMessageId || undefined,
      rawPayload: (m.rawPayload as Record<string, unknown>) || undefined,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })) as Message[];
  }

  async findByExternalMessageId(
    externalMessageId: string,
  ): Promise<Message | null> {
    const results = await this.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.externalMessageId, externalMessageId))
      .limit(1);

    if (results.length === 0) return null;
    const message = results[0];
    return {
      ...message,
      externalMessageId: message.externalMessageId || undefined,
      rawPayload: (message.rawPayload as Record<string, unknown>) || undefined,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    } as Message;
  }

  async findAll(): Promise<Message[]> {
    const results = await this.db.select().from(schema.messages);
    return results.map((m) => ({
      ...m,
      externalMessageId: m.externalMessageId || undefined,
      rawPayload: (m.rawPayload as Record<string, unknown>) || undefined,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })) as Message[];
  }

  async findRecentByJid(jid: string, limit = 10): Promise<Message[]> {
    const cleanJid = jid.replace(/:\d+@/, "@");
    const results = await this.db
      .select()
      .from(schema.messages)
      .where(
        or(
          eq(schema.messages.from, cleanJid),
          eq(schema.messages.to, cleanJid),
        ),
      )
      .orderBy(desc(schema.messages.createdAt))
      .limit(limit);

    // Return in chronological order for conversation memory
    return results.reverse().map((m) => ({
      ...m,
      externalMessageId: m.externalMessageId || undefined,
      mediaUrl: m.mediaUrl || undefined,
      mediaCaption: m.mediaCaption || undefined,
      mediaMimeType: m.mediaMimeType || undefined,
      rawPayload: (m.rawPayload as Record<string, unknown>) || undefined,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })) as Message[];
  }

  async save(entity: Message): Promise<Message> {
    const results = await this.db
      .insert(schema.messages)
      .values({
        id: entity.id,
        sessionId: entity.sessionId,
        externalMessageId: entity.externalMessageId || null,
        direction: entity.direction,
        from: entity.from,
        to: entity.to,
        type: entity.type,
        content: entity.content,
        mediaUrl: entity.mediaUrl || null,
        mediaCaption: entity.mediaCaption || null,
        mediaMimeType: entity.mediaMimeType || null,
        status: entity.status,
        rawPayload: entity.rawPayload || null,
      })
      .returning();

    const message = results[0];
    return {
      ...message,
      externalMessageId: message.externalMessageId || undefined,
      mediaUrl: message.mediaUrl || undefined,
      mediaCaption: message.mediaCaption || undefined,
      mediaMimeType: message.mediaMimeType || undefined,
      rawPayload: (message.rawPayload as Record<string, unknown>) || undefined,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    } as Message;
  }

  async update(id: string, partial: Partial<Message>): Promise<Message | null> {
    const results = await this.db
      .update(schema.messages)
      .set({
        sessionId: partial.sessionId,
        externalMessageId:
          partial.externalMessageId === undefined
            ? undefined
            : partial.externalMessageId || null,
        direction: partial.direction,
        from: partial.from,
        to: partial.to,
        type: partial.type,
        content: partial.content,
        mediaUrl: partial.mediaUrl,
        mediaCaption: partial.mediaCaption,
        mediaMimeType: partial.mediaMimeType,
        status: partial.status,
        rawPayload:
          partial.rawPayload === undefined
            ? undefined
            : partial.rawPayload || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.messages.id, id))
      .returning();

    if (results.length === 0) return null;
    const message = results[0];
    return {
      ...message,
      externalMessageId: message.externalMessageId || undefined,
      mediaUrl: message.mediaUrl || undefined,
      mediaCaption: message.mediaCaption || undefined,
      mediaMimeType: message.mediaMimeType || undefined,
      rawPayload: (message.rawPayload as Record<string, unknown>) || undefined,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    } as Message;
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(schema.messages).where(eq(schema.messages.id, id));
    return true;
  }
}
