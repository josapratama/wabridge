import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { SessionRepository } from "../interfaces";
import { Session } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleSessionRepository implements SessionRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<Session | null> {
    const results = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, id))
      .limit(1);

    if (results.length === 0) return null;
    const session = results[0];
    return {
      ...session,
      metadata: (session.metadata as Record<string, unknown>) || {},
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    } as Session;
  }

  async findByProviderConfigId(providerConfigId: string): Promise<Session[]> {
    const results = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.providerConfigId, providerConfigId));

    return results.map((s) => ({
      ...s,
      metadata: (s.metadata as Record<string, unknown>) || {},
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })) as Session[];
  }

  async findAll(): Promise<Session[]> {
    const results = await this.db.select().from(schema.sessions);
    return results.map((s) => ({
      ...s,
      metadata: (s.metadata as Record<string, unknown>) || {},
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })) as Session[];
  }

  async findAllByUserId(userId: string): Promise<Session[]> {
    const results = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, userId));
    return results.map((s) => ({
      ...s,
      metadata: (s.metadata as Record<string, unknown>) || {},
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })) as Session[];
  }

  async save(entity: Session): Promise<Session> {
    const results = await this.db
      .insert(schema.sessions)
      .values({
        id: entity.id,
        userId: entity.userId,
        name: entity.name,
        providerType: entity.providerType,
        providerConfigId: entity.providerConfigId,
        status: entity.status,
        metadata: entity.metadata || null,
      })
      .returning();

    const session = results[0];
    return {
      ...session,
      metadata: (session.metadata as Record<string, unknown>) || {},
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    } as Session;
  }

  async update(id: string, partial: Partial<Session>): Promise<Session | null> {
    const results = await this.db
      .update(schema.sessions)
      .set({
        userId: partial.userId,
        name: partial.name,
        providerType: partial.providerType,
        providerConfigId: partial.providerConfigId,
        status: partial.status,
        metadata:
          partial.metadata === undefined ? undefined : partial.metadata || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.sessions.id, id))
      .returning();

    if (results.length === 0) return null;
    const session = results[0];
    return {
      ...session,
      metadata: (session.metadata as Record<string, unknown>) || {},
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    } as Session;
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(schema.sessions).where(eq(schema.sessions.id, id));
    return true;
  }
}
