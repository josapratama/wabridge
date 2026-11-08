import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import { ContactRepository } from "../interfaces";
import { Contact } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleContactRepository implements ContactRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<Contact | null> {
    const results = await this.db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.id, id))
      .limit(1);

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async findAllByUserId(userId: string): Promise<Contact[]> {
    const results = await this.db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.userId, userId));

    return results.map((r) => this.mapToEntity(r));
  }

  async findByPhone(userId: string, phone: string): Promise<Contact | null> {
    const results = await this.db
      .select()
      .from(schema.contacts)
      .where(
        and(eq(schema.contacts.userId, userId), eq(schema.contacts.phone, phone)),
      )
      .limit(1);

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async save(entity: Contact): Promise<Contact> {
    const results = await this.db
      .insert(schema.contacts)
      .values({
        id: entity.id,
        userId: entity.userId,
        name: entity.name,
        phone: entity.phone,
        tags: entity.tags,
        notes: entity.notes ?? null,
      })
      .returning();

    return this.mapToEntity(results[0]);
  }

  async update(
    id: string,
    partial: Partial<Contact>,
  ): Promise<Contact | null> {
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (partial.name !== undefined) updateValues.name = partial.name;
    if (partial.phone !== undefined) updateValues.phone = partial.phone;
    if (partial.tags !== undefined) updateValues.tags = partial.tags;
    if (partial.notes !== undefined) updateValues.notes = partial.notes;

    const results = await this.db
      .update(schema.contacts)
      .set(updateValues)
      .where(eq(schema.contacts.id, id))
      .returning();

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(schema.contacts)
      .where(eq(schema.contacts.id, id));
  }

  private mapToEntity(
    raw: typeof schema.contacts.$inferSelect,
  ): Contact {
    return {
      id: raw.id,
      userId: raw.userId,
      name: raw.name,
      phone: raw.phone,
      tags: raw.tags as string[],
      notes: raw.notes ?? undefined,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
    };
  }
}
