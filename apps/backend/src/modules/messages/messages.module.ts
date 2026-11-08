import { Module, forwardRef } from "@nestjs/common";
import { AppLogger } from "../../common/logger/app.logger";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { ProviderRoutingModule } from "../provider-routing/provider-routing.module";
import { EventsModule } from "../events/events.module";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";
import { WebhookOutboundModule } from "../webhook-outbound/webhook-outbound.module";
import { AutoReplyModule } from "../auto-reply/auto-reply.module";

@Module({
  imports: [
    RepositoriesModule,
    ProviderRoutingModule,
    EventsModule,
    WebhookOutboundModule,
    forwardRef(() => AutoReplyModule),
  ],
  controllers: [MessagesController],
  providers: [AppLogger, MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
