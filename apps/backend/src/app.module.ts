import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { appConfig } from "./config/app.config";
import { validateConfig } from "./config/config.validation";
import { LoggerModule } from "./common/logger/logger.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { RepositoriesModule } from "./repositories/repositories.module";
import { HealthModule } from "./modules/health/health.module";
import { ProviderConfigsModule } from "./modules/provider-configs/provider-configs.module";
import { SessionsModule } from "./modules/sessions/sessions.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";
import { EventsModule } from "./modules/events/events.module";
import { DatabaseModule } from "./common/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ApiKeysModule } from "./modules/api-keys/api-keys.module";
import { V1Module } from "./modules/v1/v1.module";
import { WebhookOutboundModule } from "./modules/webhook-outbound/webhook-outbound.module";
import { MessageTemplatesModule } from "./modules/message-templates/message-templates.module";
import { ScheduledMessagesModule } from "./modules/scheduled-messages/scheduled-messages.module";
import { AutoReplyModule } from "./modules/auto-reply/auto-reply.module";
import { ContactsModule } from "./modules/contacts/contacts.module";
import { BroadcastModule } from "./modules/broadcast/broadcast.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { TeamModule } from "./modules/team/team.module";
import { SessionHealthModule } from "./modules/session-health/session-health.module";
import { RateLimitModule } from "./modules/rate-limit/rate-limit.module";
import { IpWhitelistModule } from "./modules/ip-whitelist/ip-whitelist.module";
import { ExportModule } from "./modules/export/export.module";
import { AiBotModule } from "./modules/ai-bot/ai-bot.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateConfig,
      envFilePath: ".env",
    }),
    LoggerModule,
    DatabaseModule,
    RepositoriesModule,
    AuthModule,
    ApiKeysModule,
    V1Module,
    WebhookOutboundModule,
    MessageTemplatesModule,
    ScheduledMessagesModule,
    AutoReplyModule,
    AiBotModule,
    ContactsModule,
    BroadcastModule,
    AnalyticsModule,
    TeamModule,
    SessionHealthModule,
    RateLimitModule,
    IpWhitelistModule,
    ExportModule,
    HealthModule,
    ProviderConfigsModule,
    SessionsModule,
    MessagesModule,
    WebhooksModule,
    EventsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
