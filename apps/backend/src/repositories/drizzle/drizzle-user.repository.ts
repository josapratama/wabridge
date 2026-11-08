import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { UserRepository } from "../interfaces";
import { User } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const results = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (results.length === 0) return null;
    const user = results[0];
    return {
      ...user,
      name: user.name ?? undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const results = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (results.length === 0) return null;
    const user = results[0];
    return {
      ...user,
      name: user.name ?? undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async findAll(): Promise<User[]> {
    const users = await this.db.select().from(schema.users);
    return users.map((u) => ({
      ...u,
      name: u.name ?? undefined,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));
  }

  async save(entity: User): Promise<User> {
    const results = await this.db
      .insert(schema.users)
      .values({
        id: entity.id,
        email: entity.email,
        password: entity.password!,
        name: entity.name ?? null,
      })
      .returning();

    const user = results[0];
    return {
      ...user,
      name: user.name ?? undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async update(id: string, partial: Partial<User>): Promise<User | null> {
    const results = await this.db
      .update(schema.users)
      .set({
        email: partial.email,
        password: partial.password,
        name: partial.name ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();

    if (results.length === 0) return null;
    const user = results[0];
    return {
      ...user,
      name: user.name ?? undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(schema.users).where(eq(schema.users.id, id));
    return true;
  }
}
