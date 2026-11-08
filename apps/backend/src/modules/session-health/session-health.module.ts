import { Module } from "@nestjs/common";
import { SessionHealthService } from "./session-health.service";
import { SessionHealthController } from "./session-health.controller";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { WebhookOutboundModule } from "../webhook-outbound/webhook-outbound.module";
import { ProviderRoutingModule } from "../provider-routing/provider-routing.module";

@Module({
  imports: [RepositoriesModule, WebhookOutboundModule, ProviderRoutingModule],
  providers: [SessionHealthService],
  controllers: [SessionHealthController],
  exports: [SessionHealthService],
})
export class SessionHealthModule {}
