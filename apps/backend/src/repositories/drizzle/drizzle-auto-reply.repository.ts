import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, or, and, isNull, desc } from "drizzle-orm";
import { AutoReplyRuleRepository } from "../interfaces";
import { AutoReplyRule } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleAutoReplyRuleRepository implements AutoReplyRuleRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<AutoReplyRule | null> {
    const results = await this.db
      .select()
      .from(schema.autoReplyRules)
      .where(eq(schema.autoReplyRules.id, id))
      .limit(1);

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async findAllByUserId(userId: string): Promise<AutoReplyRule[]> {
    const results = await this.db
      .select()
      .from(schema.autoReplyRules)
      .where(eq(schema.autoReplyRules.userId, userId))
      .orderBy(desc(schema.autoReplyRules.priority));

    return results.map((r) => this.mapToEntity(r));
  }

  async findActiveForSession(sessionId: string): Promise<AutoReplyRule[]> {
    const results = await this.db
      .select()
      .from(schema.autoReplyRules)
      .where(
        and(
          eq(schema.autoReplyRules.isActive, true),
          or(
            eq(schema.autoReplyRules.sessionId, sessionId),
            isNull(schema.autoReplyRules.sessionId),
          ),
        ),
      )
      .orderBy(desc(schema.autoReplyRules.priority));

    return results.map((r) => this.mapToEntity(r));
  }

  async save(entity: AutoReplyRule): Promise<AutoReplyRule> {
    const results = await this.db
      .insert(schema.autoReplyRules)
      .values({
        id: entity.id,
        userId: entity.userId,
        sessionId: entity.sessionId ?? null,
        name: entity.name,
        matchType: entity.matchType,
        matchValue: entity.matchValue,
        replyContent: entity.replyContent,
        isActive: entity.isActive,
        priority: entity.priority,
      })
      .returning();

    return this.mapToEntity(results[0]);
  }

  async update(
    id: string,
    partial: Partial<AutoReplyRule>,
  ): Promise<AutoReplyRule | null> {
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (partial.name !== undefined) updateValues.name = partial.name;
    if (partial.sessionId !== undefined)
      updateValues.sessionId = partial.sessionId ?? null;
    if (partial.matchType !== undefined) updateValues.matchType = partial.matchType;
    if (partial.matchValue !== undefined)
      updateValues.matchValue = partial.matchValue;
    if (partial.replyContent !== undefined)
      updateValues.replyContent = partial.replyContent;
    if (partial.isActive !== undefined) updateValues.isActive = partial.isActive;
    if (partial.priority !== undefined) updateValues.priority = partial.priority;

    const results = await this.db
      .update(schema.autoReplyRules)
      .set(updateValues)
      .where(eq(schema.autoReplyRules.id, id))
      .returning();

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(schema.autoReplyRules)
      .where(eq(schema.autoReplyRules.id, id));
  }

  private mapToEntity(
    raw: typeof schema.autoReplyRules.$inferSelect,
  ): AutoReplyRule {
    return {
      id: raw.id,
      userId: raw.userId,
      sessionId: raw.sessionId ?? undefined,
      name: raw.name,
      matchType: raw.matchType as AutoReplyRule["matchType"],
      matchValue: raw.matchValue,
      replyContent: raw.replyContent,
      isActive: raw.isActive,
      priority: raw.priority,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
    };
  }
}
