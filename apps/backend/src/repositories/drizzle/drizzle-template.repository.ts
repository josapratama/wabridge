import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { MessageTemplateRepository } from "../interfaces";
import { MessageTemplate } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleMessageTemplateRepository
  implements MessageTemplateRepository
{
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<MessageTemplate | null> {
    const results = await this.db
      .select()
      .from(schema.messageTemplates)
      .where(eq(schema.messageTemplates.id, id))
      .limit(1);

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async findAllByUserId(userId: string): Promise<MessageTemplate[]> {
    const results = await this.db
      .select()
      .from(schema.messageTemplates)
      .where(eq(schema.messageTemplates.userId, userId));

    return results.map((r) => this.mapToEntity(r));
  }

  async save(entity: MessageTemplate): Promise<MessageTemplate> {
    const results = await this.db
      .insert(schema.messageTemplates)
      .values({
        id: entity.id,
        userId: entity.userId,
        name: entity.name,
        content: entity.content,
        variables: entity.variables,
      })
      .returning();

    return this.mapToEntity(results[0]);
  }

  async update(
    id: string,
    partial: Partial<MessageTemplate>,
  ): Promise<MessageTemplate | null> {
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (partial.name !== undefined) updateValues.name = partial.name;
    if (partial.content !== undefined) updateValues.content = partial.content;
    if (partial.variables !== undefined) updateValues.variables = partial.variables;

    const results = await this.db
      .update(schema.messageTemplates)
      .set(updateValues)
      .where(eq(schema.messageTemplates.id, id))
      .returning();

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(schema.messageTemplates)
      .where(eq(schema.messageTemplates.id, id));
  }

  private mapToEntity(
    raw: typeof schema.messageTemplates.$inferSelect,
  ): MessageTemplate {
    return {
      id: raw.id,
      userId: raw.userId,
      name: raw.name,
      content: raw.content,
      variables: raw.variables as string[],
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
    };
  }
}
