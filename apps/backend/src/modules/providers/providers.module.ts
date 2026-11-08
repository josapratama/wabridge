import { Module } from "@nestjs/common";
import { AppLogger } from "../../common/logger/app.logger";
import { HttpClient } from "../../common/http/http-client";
import { MetaCloudWhatsAppProvider } from "./meta-cloud/meta-cloud.provider";
import { BspWhatsAppProvider } from "./bsp/bsp.provider";
import { BaileysWhatsAppProvider } from "./baileys/baileys.provider";
import { DefaultBspNormalizer } from "./bsp/default-bsp-normalizer";
import { EventsModule } from "../../modules/events/events.module";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { AutoReplyModule } from "../auto-reply/auto-reply.module";
import { WebhookOutboundModule } from "../webhook-outbound/webhook-outbound.module";

@Module({
  imports: [
    EventsModule,
    RepositoriesModule,
    AutoReplyModule,
    WebhookOutboundModule,
  ],
  providers: [
    AppLogger,
    HttpClient,
    DefaultBspNormalizer,
    MetaCloudWhatsAppProvider,
    BspWhatsAppProvider,
    BaileysWhatsAppProvider,
  ],
  exports: [
    MetaCloudWhatsAppProvider,
    BspWhatsAppProvider,
    BaileysWhatsAppProvider,
  ],
})
export class ProvidersModule {}
