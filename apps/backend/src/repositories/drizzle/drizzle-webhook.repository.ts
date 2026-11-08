import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, desc } from "drizzle-orm";
import {
  WebhookEndpointRepository,
  WebhookLogRepository,
} from "../interfaces";
import { WebhookEndpoint, WebhookLog } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleWebhookEndpointRepository
  implements WebhookEndpointRepository
{
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<WebhookEndpoint | null> {
    const results = await this.db
      .select()
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.id, id))
      .limit(1);

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async findAllByUserId(userId: string): Promise<WebhookEndpoint[]> {
    const results = await this.db
      .select()
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.userId, userId));

    return results.map((r) => this.mapToEntity(r));
  }

  async findActiveAll(): Promise<WebhookEndpoint[]> {
    const results = await this.db
      .select()
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.isActive, true));

    return results.map((r) => this.mapToEntity(r));
  }

  async save(entity: WebhookEndpoint): Promise<WebhookEndpoint> {
    const results = await this.db
      .insert(schema.webhookEndpoints)
      .values({
        id: entity.id,
        userId: entity.userId,
        name: entity.name,
        url: entity.url,
        secret: entity.secret ?? null,
        events: entity.events,
        isActive: entity.isActive,
      })
      .returning();

    return this.mapToEntity(results[0]);
  }

  async update(
    id: string,
    partial: Partial<WebhookEndpoint>,
  ): Promise<WebhookEndpoint | null> {
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (partial.name !== undefined) updateValues.name = partial.name;
    if (partial.url !== undefined) updateValues.url = partial.url;
    if (partial.secret !== undefined) updateValues.secret = partial.secret;
    if (partial.events !== undefined) updateValues.events = partial.events;
    if (partial.isActive !== undefined) updateValues.isActive = partial.isActive;

    const results = await this.db
      .update(schema.webhookEndpoints)
      .set(updateValues)
      .where(eq(schema.webhookEndpoints.id, id))
      .returning();

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.id, id));
  }

  private mapToEntity(
    raw: typeof schema.webhookEndpoints.$inferSelect,
  ): WebhookEndpoint {
    return {
      id: raw.id,
      userId: raw.userId,
      name: raw.name,
      url: raw.url,
      secret: raw.secret ?? undefined,
      events: raw.events as string[],
      isActive: raw.isActive,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class DrizzleWebhookLogRepository implements WebhookLogRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async save(entity: WebhookLog): Promise<WebhookLog> {
    const results = await this.db
      .insert(schema.webhookLogs)
      .values({
        id: entity.id,
        webhookEndpointId: entity.webhookEndpointId,
        eventType: entity.eventType,
        payload: entity.payload,
        responseStatus: entity.responseStatus ?? null,
        responseBody: entity.responseBody ?? null,
        durationMs: entity.durationMs ?? null,
        attempt: entity.attempt,
        success: entity.success,
      })
      .returning();

    const r = results[0];
    return {
      id: r.id,
      webhookEndpointId: r.webhookEndpointId,
      eventType: r.eventType,
      payload: r.payload as Record<string, unknown>,
      responseStatus: r.responseStatus ?? undefined,
      responseBody: r.responseBody ?? undefined,
      durationMs: r.durationMs ?? undefined,
      attempt: r.attempt,
      success: r.success,
      createdAt: r.createdAt.toISOString(),
    };
  }

  async findByEndpointId(
    endpointId: string,
    limit: number = 50,
  ): Promise<WebhookLog[]> {
    const results = await this.db
      .select()
      .from(schema.webhookLogs)
      .where(eq(schema.webhookLogs.webhookEndpointId, endpointId))
      .orderBy(desc(schema.webhookLogs.createdAt))
      .limit(limit);

    return results.map((r) => ({
      id: r.id,
      webhookEndpointId: r.webhookEndpointId,
      eventType: r.eventType,
      payload: r.payload as Record<string, unknown>,
      responseStatus: r.responseStatus ?? undefined,
      responseBody: r.responseBody ?? undefined,
      durationMs: r.durationMs ?? undefined,
      attempt: r.attempt,
      success: r.success,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async findById(id: string): Promise<WebhookLog | null> {
    const results = await this.db
      .select()
      .from(schema.webhookLogs)
      .where(eq(schema.webhookLogs.id, id));

    if (results.length === 0) return null;
    const r = results[0];
    return {
      id: r.id,
      webhookEndpointId: r.webhookEndpointId,
      eventType: r.eventType,
      payload: r.payload as Record<string, unknown>,
      responseStatus: r.responseStatus ?? undefined,
      responseBody: r.responseBody ?? undefined,
      durationMs: r.durationMs ?? undefined,
      attempt: r.attempt,
      success: r.success,
      createdAt: r.createdAt.toISOString(),
    };
  }

  async findRecentLogs(limit: number = 100): Promise<WebhookLog[]> {
    const results = await this.db
      .select()
      .from(schema.webhookLogs)
      .orderBy(desc(schema.webhookLogs.createdAt))
      .limit(limit);

    return results.map((r) => ({
      id: r.id,
      webhookEndpointId: r.webhookEndpointId,
      eventType: r.eventType,
      payload: r.payload as Record<string, unknown>,
      responseStatus: r.responseStatus ?? undefined,
      responseBody: r.responseBody ?? undefined,
      durationMs: r.durationMs ?? undefined,
      attempt: r.attempt,
      success: r.success,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
