import { Injectable, Inject, Optional } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  SessionHealthRepository,
  SessionRepository,
  ProviderConfigRepository,
} from "../../repositories/interfaces";
import { SessionHealthLog } from "../../common/types";
import { AppLogger } from "../../common/logger/app.logger";
import { WebhookOutboundService } from "../webhook-outbound/webhook-outbound.service";
import { ProviderRoutingService } from "../provider-routing/provider-routing.service";

@Injectable()
export class SessionHealthService {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(SessionHealthRepository)
    private readonly healthRepo: SessionHealthRepository,
    @Inject(SessionRepository) private readonly sessionRepo: SessionRepository,
    @Inject(ProviderConfigRepository)
    private readonly configRepo: ProviderConfigRepository,
    private readonly webhookService: WebhookOutboundService,
    private readonly logger: AppLogger,
    @Optional()
    private readonly providerRoutingService?: ProviderRoutingService,
  ) {}

  onModuleInit() {
    // Check health every 60 seconds
    this.timer = setInterval(() => void this.checkAll(), 60_000);
    // Initial check after 5 seconds
    setTimeout(() => void this.checkAll(), 5_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async getAll(): Promise<SessionHealthLog[]> {
    return this.healthRepo.findAllLatest();
  }

  async getForSession(sessionId: string): Promise<SessionHealthLog | null> {
    return this.healthRepo.findLatestBySessionId(sessionId);
  }

  async recordStatus(
    sessionId: string,
    status: SessionHealthLog["status"],
    latencyMs?: number,
  ): Promise<void> {
    await this.healthRepo.save({
      id: uuidv4(),
      sessionId,
      status,
      latencyMs,
      messagesSentToday: 0,
      messagesReceivedToday: 0,
      checkedAt: new Date().toISOString(),
    });

    if (status === "disconnected") {
      void this.webhookService.dispatch("session.disconnected", { sessionId });
    } else if (status === "connected") {
      void this.webhookService.dispatch("session.connected", { sessionId });
    }
  }

  private async checkAll(): Promise<void> {
    const sessions = await this.sessionRepo.findAll();
    this.logger.log(
      `Health check: running for ${sessions.length} sessions`,
      "SessionHealth",
    );

    for (const session of sessions) {
      if (!this.providerRoutingService) continue;
      try {
        const start = Date.now();
        const provider = this.providerRoutingService.getProvider(
          session.providerType,
        );
        const health = await provider.getHealth(
          session.providerConfigId,
          session.id,
        );
        const latency = Date.now() - start;
        const status: SessionHealthLog["status"] = health.healthy
          ? "connected"
          : "disconnected";

        await this.recordStatus(session.id, status, latency);
      } catch (err) {
        await this.recordStatus(session.id, "disconnected", 0);
      }
    }
  }
}
