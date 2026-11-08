import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { ApiKeyRepository } from "../interfaces";
import { ApiKey } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleApiKeyRepository implements ApiKeyRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<ApiKey | null> {
    const results = await this.db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.id, id))
      .limit(1);

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async findByHash(keyHash: string): Promise<ApiKey | null> {
    const results = await this.db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.keyHash, keyHash))
      .limit(1);

    if (results.length === 0) return null;
    return this.mapToEntity(results[0]);
  }

  async findAllByUserId(userId: string): Promise<ApiKey[]> {
    const results = await this.db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.userId, userId));

    return results.map((r) => this.mapToEntity(r));
  }

  async save(entity: ApiKey): Promise<ApiKey> {
    const results = await this.db
      .insert(schema.apiKeys)
      .values({
        id: entity.id,
        userId: entity.userId,
        name: entity.name,
        keyHash: entity.keyHash,
        keyPrefix: entity.keyPrefix,
        isActive: entity.isActive,
        expiresAt: entity.expiresAt ? new Date(entity.expiresAt) : null,
      })
      .returning();

    return this.mapToEntity(results[0]);
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.db
      .update(schema.apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(schema.apiKeys.id, id));
  }

  async revoke(id: string): Promise<void> {
    await this.db
      .update(schema.apiKeys)
      .set({ isActive: false })
      .where(eq(schema.apiKeys.id, id));
  }

  private mapToEntity(raw: typeof schema.apiKeys.$inferSelect): ApiKey {
    return {
      id: raw.id,
      userId: raw.userId,
      name: raw.name,
      keyHash: raw.keyHash,
      keyPrefix: raw.keyPrefix,
      lastUsedAt: raw.lastUsedAt?.toISOString(),
      expiresAt: raw.expiresAt?.toISOString(),
      isActive: raw.isActive,
      createdAt: raw.createdAt.toISOString(),
    };
  }
}
