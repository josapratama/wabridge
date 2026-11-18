import { Inject, Injectable, NotFoundException, Optional } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import type { ProviderConfig } from "../../common/types";
import {
  ProviderConfigRepository,
  SessionRepository,
} from "../../repositories/interfaces";
import { ProviderRoutingService } from "../provider-routing/provider-routing.service";
import { CreateProviderConfigDto } from "./dto/create-provider-config.dto";
import { UpdateProviderConfigDto } from "./dto/update-provider-config.dto";

@Injectable()
export class ProviderConfigsService {
  constructor(
    @Inject(ProviderConfigRepository)
    private readonly repo: ProviderConfigRepository,
    @Optional()
    @Inject(SessionRepository)
    private readonly sessionRepo?: SessionRepository,
    @Optional()
    private readonly routingService?: ProviderRoutingService,
  ) {}

  async create(userId: string, dto: CreateProviderConfigDto): Promise<ProviderConfig> {
    const now = new Date().toISOString();
    const config: ProviderConfig = {
      id: uuidv4(),
      userId,
      providerType: dto.providerType,
      name: dto.name,
      baseUrl: dto.baseUrl,
      apiVersion: dto.apiVersion,
      phoneNumberId: dto.phoneNumberId,
      wabaId: dto.wabaId,
      accessToken: dto.accessToken,
      verifyToken: dto.verifyToken,
      webhookSecret: dto.webhookSecret,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.save(config);
  }

  async findAll(userId?: string): Promise<ProviderConfig[]> {
    if (userId) {
      return this.repo.findAllByUserId(userId);
    }
    return this.repo.findAll();
  }

  async findById(id: string, userId?: string): Promise<ProviderConfig> {
    const config = await this.repo.findById(id);
    if (!config) throw new NotFoundException(`ProviderConfig ${id} not found`);
    if (userId && config.userId && config.userId !== userId) {
      throw new NotFoundException(`ProviderConfig ${id} not found`);
    }
    return config;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateProviderConfigDto,
  ): Promise<ProviderConfig> {
    await this.findById(id, userId);
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new NotFoundException(`ProviderConfig ${id} not found`);
    return updated;
  }

  async activate(id: string, userId?: string): Promise<ProviderConfig> {
    await this.findById(id, userId);
    const updated = await this.repo.update(id, { isActive: true });
    if (!updated) throw new NotFoundException(`ProviderConfig ${id} not found`);
    return updated;
  }

  async deactivate(id: string, userId?: string): Promise<ProviderConfig> {
    const config = await this.findById(id, userId);

    // Disconnect all sessions tied to this provider config
    if (this.sessionRepo && this.routingService) {
      try {
        const sessions = await this.sessionRepo.findByProviderConfigId(id);
        const provider = this.routingService.getProvider(config.providerType);
        for (const s of sessions) {
          if (provider?.disconnectAccount) {
            await provider.disconnectAccount(s.id, id);
          }
          await this.sessionRepo.update(s.id, { status: "inactive" });
        }
      } catch {}
    }

    const updated = await this.repo.update(id, { isActive: false });
    if (!updated) throw new NotFoundException(`ProviderConfig ${id} not found`);
    return updated;
  }
}
