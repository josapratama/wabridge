import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { ApiKeyRepository } from "../../repositories/interfaces";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";
import { ApiKey } from "../../common/types";

@Injectable()
export class ApiKeysService {
  constructor(
    @Inject(ApiKeyRepository)
    private readonly apiKeyRepository: ApiKeyRepository,
  ) {}

  /**
   * Generate a new API key for a user.
   * Returns the plain key ONCE — it is never stored in plain text.
   *
   * Format: wai_live_<32 random hex bytes>
   * Stored:  SHA-256 hash of the full key
   * Display: first 16 chars of the key (prefix) for identification
   */
  async create(
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<{ apiKey: ApiKey; plainKey: string }> {
    const rawSecret = randomBytes(32).toString("hex"); // 64 hex chars
    const plainKey = `wai_live_${rawSecret}`;
    const keyHash = this.hash(plainKey);
    const keyPrefix = plainKey.slice(0, 16); // "wai_live_" + 7 chars

    const entity: ApiKey = {
      id: uuidv4(),
      userId,
      name: dto.name,
      keyHash,
      keyPrefix,
      isActive: true,
      expiresAt: dto.expiresAt,
      createdAt: new Date().toISOString(),
    };

    const saved = await this.apiKeyRepository.save(entity);
    return { apiKey: saved, plainKey };
  }

  async listByUser(userId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.findAllByUserId(userId);
  }

  async revoke(id: string, userId: string): Promise<void> {
    const key = await this.apiKeyRepository.findById(id);
    if (!key) throw new NotFoundException("API key not found");
    if (key.userId !== userId) throw new ForbiddenException();
    await this.apiKeyRepository.revoke(id);
  }

  /**
   * Validate an incoming API key.
   * Returns the ApiKey record if valid, null otherwise.
   */
  async validate(plainKey: string): Promise<ApiKey | null> {
    if (!plainKey.startsWith("wai_live_")) return null;

    const keyHash = this.hash(plainKey);
    const key = await this.apiKeyRepository.findByHash(keyHash);

    if (!key) return null;
    if (!key.isActive) return null;
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return null;

    // Fire-and-forget last used update
    void this.apiKeyRepository.updateLastUsed(key.id);

    return key;
  }

  private hash(plainKey: string): string {
    return createHash("sha256").update(plainKey).digest("hex");
  }
}
