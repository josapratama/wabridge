import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import type { Session } from "../../common/types";
import {
  ProviderConfigRepository,
  SessionRepository,
} from "../../repositories/interfaces";
import { CreateSessionDto } from "./dto/create-session.dto";
import { ProviderRoutingService } from "../provider-routing/provider-routing.service";
import { AppLogger } from "../../common/logger/app.logger";

@Injectable()
export class SessionsService implements OnApplicationBootstrap {
  constructor(
    @Inject(SessionRepository)
    private readonly sessionRepo: SessionRepository,
    @Inject(ProviderConfigRepository)
    private readonly configRepo: ProviderConfigRepository,
    private readonly routingService: ProviderRoutingService,
    private readonly logger: AppLogger,
  ) {}

  onApplicationBootstrap(): void {
    // Wait 3 seconds for database and socket managers to be fully initialized
    setTimeout(async () => {
      try {
        const allSessions = await this.sessionRepo.findAll();
        const activeSessions = allSessions.filter((s) => s.status === "active");
        if (activeSessions.length === 0) return;

        this.logger.log(
          `Bootstrapping ${activeSessions.length} active WhatsApp session(s)...`,
          "SessionsService",
        );

        for (const session of activeSessions) {
          try {
            await this.activate(session.id);
            // Stagger 1.5s between sessions to avoid CPU spikes / socket collision
            await new Promise((r) => setTimeout(r, 1500));
          } catch (err) {
            this.logger.warn(
              `Auto-reconnect failed for session ${session.id} (${session.name}): ${err}`,
              "SessionsService",
            );
          }
        }
      } catch (err) {
        this.logger.warn(
          `Failed to bootstrap active sessions on startup: ${err}`,
          "SessionsService",
        );
      }
    }, 3000);
  }

  async create(userId: string, dto: CreateSessionDto): Promise<Session> {
    const config = await this.configRepo.findById(dto.providerConfigId);
    if (!config) {
      throw new BadRequestException(
        `ProviderConfig ${dto.providerConfigId} not found`,
      );
    }
    if (config.userId && config.userId !== userId) {
      throw new BadRequestException(
        `ProviderConfig ${dto.providerConfigId} does not belong to your account`,
      );
    }

    const now = new Date().toISOString();
    const session: Session = {
      id: uuidv4(),
      userId,
      name: dto.name,
      providerType: config.providerType,
      providerConfigId: dto.providerConfigId,
      status: "inactive", // start inactive — user must explicitly activate
      metadata: {
        ...(dto.aiProfileId ? { aiProfileId: dto.aiProfileId } : {}),
      },
      createdAt: now,
      updatedAt: now,
    };

    return this.sessionRepo.save(session);
  }

  async findAll(userId?: string): Promise<Session[]> {
    if (userId) {
      return this.sessionRepo.findAllByUserId(userId);
    }
    return this.sessionRepo.findAll();
  }

  async findById(id: string, userId?: string): Promise<Session> {
    const session = await this.sessionRepo.findById(id);
    if (!session) throw new NotFoundException(`Session ${id} not found`);
    if (userId && session.userId && session.userId !== userId) {
      throw new NotFoundException(`Session ${id} not found`);
    }
    return session;
  }

  async activate(id: string, userId?: string): Promise<Session> {
    const session = await this.findById(id, userId);

    const config = await this.configRepo.findById(session.providerConfigId);
    if (!config) throw new NotFoundException(`ProviderConfig not found`);
    if (!config.isActive) {
      throw new BadRequestException(
        `ProviderConfig "${config.name}" is not active. Activate it first.`,
      );
    }

    // Actually connect the provider
    const provider = this.routingService.getProvider(session.providerType);
    const result = await provider.connectAccount({
      providerConfigId: config.id,
      sessionId: id,
      config,
    });

    this.logger.log(
      `connectAccount result for session ${id}: ${result.message}`,
      "SessionsService",
    );

    const updated = await this.sessionRepo.update(id, { status: "active" });
    return updated!;
  }

  async deactivate(id: string, userId?: string): Promise<Session> {
    const session = await this.findById(id, userId);

    // Disconnect socket from WhatsApp provider
    try {
      const provider = this.routingService.getProvider(session.providerType);
      if (provider.disconnectAccount) {
        await provider.disconnectAccount(id, session.providerConfigId);
      }
    } catch (err) {
      this.logger.warn(
        `Failed to disconnect socket for session ${id}: ${err}`,
        "SessionsService",
      );
    }

    const updated = await this.sessionRepo.update(id, { status: "inactive" });
    if (!updated) throw new NotFoundException(`Session ${id} not found`);
    return updated;
  }

  async setAiProfile(
    id: string,
    userId: string,
    aiProfileId: string | null,
  ): Promise<Session> {
    const session = await this.findById(id, userId);
    const metadata = {
      ...(session.metadata || {}),
      aiProfileId: aiProfileId || null,
    };
    const updated = await this.sessionRepo.update(id, { metadata });
    if (!updated) throw new NotFoundException(`Session ${id} not found`);
    return updated;
  }

  async getGroups(id: string, userId?: string) {
    const session = await this.findById(id, userId);
    const provider = this.routingService.getProvider(session.providerType);
    if ("getGroups" in provider && typeof (provider as any).getGroups === "function") {
      return (provider as any).getGroups(id, session.providerConfigId);
    }
    return [];
  }
}
