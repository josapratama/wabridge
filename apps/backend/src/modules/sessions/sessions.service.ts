import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
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
export class SessionsService {
  constructor(
    @Inject(SessionRepository)
    private readonly sessionRepo: SessionRepository,
    @Inject(ProviderConfigRepository)
    private readonly configRepo: ProviderConfigRepository,
    private readonly routingService: ProviderRoutingService,
    private readonly logger: AppLogger,
  ) {}

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
      metadata: {},
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
    await this.findById(id, userId);
    const updated = await this.sessionRepo.update(id, { status: "inactive" });
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
