import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { AppLogger } from "../../common/logger/app.logger";
import {
  SessionRepository,
  ProviderConfigRepository,
} from "../../repositories/interfaces";
import { Inject } from "@nestjs/common";
import { ProviderRoutingService } from "../provider-routing/provider-routing.service";

/**
 * Reconnects all sessions that were active before the server restarted.
 * Baileys connection state lives in memory — on restart it must be re-established.
 */
@Injectable()
export class SessionStartupService implements OnApplicationBootstrap {
  constructor(
    @Inject(SessionRepository)
    private readonly sessionRepo: SessionRepository,
    @Inject(ProviderConfigRepository)
    private readonly configRepo: ProviderConfigRepository,
    private readonly routingService: ProviderRoutingService,
    private readonly logger: AppLogger,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Small delay to let all modules fully initialize
    await new Promise((r) => setTimeout(r, 2000));
    await this.reconnectActiveSessions();
  }

  private async reconnectActiveSessions(): Promise<void> {
    const sessions = await this.sessionRepo.findAll();
    const active = sessions.filter((s) => s.status === "active");

    if (active.length === 0) {
      this.logger.log("No active sessions to reconnect", "SessionStartup");
      return;
    }

    this.logger.log(
      `Reconnecting ${active.length} active session(s) on startup...`,
      "SessionStartup",
    );

    for (const session of active) {
      try {
        const config = await this.configRepo.findById(session.providerConfigId);
        if (!config || !config.isActive) {
          this.logger.warn(
            `Skipping session "${session.name}" — provider config not active`,
            "SessionStartup",
          );
          continue;
        }

        const provider = this.routingService.getProvider(session.providerType);
        const result = await provider.connectAccount({
          providerConfigId: config.id,
          sessionId: session.id,
          config,
        });

        this.logger.log(
          `Session "${session.name}" reconnect: ${result.message}`,
          "SessionStartup",
        );
      } catch (err) {
        this.logger.error(
          `Failed to reconnect session "${session.name}": ${err}`,
          undefined,
          "SessionStartup",
        );
      }
    }
  }
}
