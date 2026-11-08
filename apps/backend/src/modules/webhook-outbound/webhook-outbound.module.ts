import { Module } from "@nestjs/common";
import { WebhookOutboundService } from "./webhook-outbound.service";
import { WebhookOutboundController } from "./webhook-outbound.controller";
import { RepositoriesModule } from "../../repositories/repositories.module";

@Module({
  imports: [RepositoriesModule],
  providers: [WebhookOutboundService],
  controllers: [WebhookOutboundController],
  exports: [WebhookOutboundService],
})
export class WebhookOutboundModule {}
