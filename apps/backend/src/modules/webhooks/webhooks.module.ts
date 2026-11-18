import { Module } from "@nestjs/common";
import { AppLogger } from "../../common/logger/app.logger";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { ProviderRoutingModule } from "../provider-routing/provider-routing.module";
import { EventsModule } from "../events/events.module";
import { AutoReplyModule } from "../auto-reply/auto-reply.module";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";

@Module({
  imports: [
    RepositoriesModule,
    ProviderRoutingModule,
    EventsModule,
    AutoReplyModule,
  ],
  controllers: [WebhooksController],
  providers: [AppLogger, WebhooksService],
})
export class WebhooksModule {}
