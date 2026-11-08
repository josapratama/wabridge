import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { EventRepository } from "../interfaces";
import { ProviderEvent } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleEventRepository implements EventRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<ProviderEvent | null> {
    const results = await this.db
      .select()
      .from(schema.providerEvents)
      .where(eq(schema.providerEvents.id, id))
      .limit(1);

    if (results.length === 0) return null;
    const event = results[0];
    return {
      ...event,
      sessionId: event.sessionId || undefined,
      payload: event.payload as Record<string, unknown>,
      createdAt: event.createdAt.toISOString(),
    } as ProviderEvent;
  }

  async findBySessionId(sessionId: string): Promise<ProviderEvent[]> {
    const results = await this.db
      .select()
      .from(schema.providerEvents)
      .where(eq(schema.providerEvents.sessionId, sessionId));

    return results.map((e) => ({
      ...e,
      sessionId: e.sessionId || undefined,
      payload: e.payload as Record<string, unknown>,
      createdAt: e.createdAt.toISOString(),
    })) as ProviderEvent[];
  }

  async findUnprocessed(): Promise<ProviderEvent[]> {
    const results = await this.db
      .select()
      .from(schema.providerEvents)
      .where(eq(schema.providerEvents.processed, false));

    return results.map((e) => ({
      ...e,
      sessionId: e.sessionId || undefined,
      payload: e.payload as Record<string, unknown>,
      createdAt: e.createdAt.toISOString(),
    })) as ProviderEvent[];
  }

  async findAll(): Promise<ProviderEvent[]> {
    const results = await this.db.select().from(schema.providerEvents);
    return results.map((e) => ({
      ...e,
      sessionId: e.sessionId || undefined,
      payload: e.payload as Record<string, unknown>,
      createdAt: e.createdAt.toISOString(),
    })) as ProviderEvent[];
  }

  async save(entity: ProviderEvent): Promise<ProviderEvent> {
    const results = await this.db
      .insert(schema.providerEvents)
      .values({
        id: entity.id,
        sessionId: entity.sessionId || null,
        providerType: entity.providerType,
        eventType: entity.eventType,
        payload: entity.payload,
        processed: entity.processed,
      })
      .returning();

    const event = results[0];
    return {
      ...event,
      sessionId: event.sessionId || undefined,
      payload: event.payload as Record<string, unknown>,
      createdAt: event.createdAt.toISOString(),
    } as ProviderEvent;
  }

  async update(
    id: string,
    partial: Partial<ProviderEvent>,
  ): Promise<ProviderEvent | null> {
    const results = await this.db
      .update(schema.providerEvents)
      .set({
        sessionId:
          partial.sessionId === undefined
            ? undefined
            : partial.sessionId || null,
        providerType: partial.providerType,
        eventType: partial.eventType,
        payload: partial.payload,
        processed: partial.processed,
      })
      .where(eq(schema.providerEvents.id, id))
      .returning();

    if (results.length === 0) return null;
    const event = results[0];
    return {
      ...event,
      sessionId: event.sessionId || undefined,
      payload: event.payload as Record<string, unknown>,
      createdAt: event.createdAt.toISOString(),
    } as ProviderEvent;
  }

  async delete(id: string): Promise<boolean> {
    await this.db
      .delete(schema.providerEvents)
      .where(eq(schema.providerEvents.id, id));
    return true;
  }
}
