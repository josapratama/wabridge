import { Module } from "@nestjs/common";
import {
  SessionRepository,
  MessageRepository,
  EventRepository,
  ProviderConfigRepository,
  UserRepository,
  ApiKeyRepository,
  WebhookEndpointRepository,
  WebhookLogRepository,
  MessageTemplateRepository,
  ScheduledMessageRepository,
  AutoReplyRuleRepository,
  ContactRepository,
  BroadcastJobRepository,
  UsageRepository,
  IpWhitelistRepository,
  SessionHealthRepository,
  TeamMemberRepository,
} from "./interfaces";
import { DrizzleUserRepository } from "./drizzle/drizzle-user.repository";
import { DrizzleSessionRepository } from "./drizzle/drizzle-session.repository";
import { DrizzleMessageRepository } from "./drizzle/drizzle-message.repository";
import { DrizzleEventRepository } from "./drizzle/drizzle-event.repository";
import { DrizzleProviderConfigRepository } from "./drizzle/drizzle-provider-config.repository";
import { DrizzleApiKeyRepository } from "./drizzle/drizzle-api-key.repository";
import {
  DrizzleWebhookEndpointRepository,
  DrizzleWebhookLogRepository,
} from "./drizzle/drizzle-webhook.repository";
import { DrizzleMessageTemplateRepository } from "./drizzle/drizzle-template.repository";
import { DrizzleScheduledMessageRepository } from "./drizzle/drizzle-scheduled-message.repository";
import { DrizzleAutoReplyRuleRepository } from "./drizzle/drizzle-auto-reply.repository";
import { DrizzleContactRepository } from "./drizzle/drizzle-contact.repository";
import { DrizzleBroadcastJobRepository } from "./drizzle/drizzle-broadcast.repository";
import { DrizzleUsageRepository } from "./drizzle/drizzle-usage.repository";
import {
  DrizzleIpWhitelistRepository,
  DrizzleSessionHealthRepository,
  DrizzleTeamMemberRepository,
} from "./drizzle/drizzle-misc.repository";

@Module({
  providers: [
    { provide: UserRepository, useClass: DrizzleUserRepository },
    { provide: SessionRepository, useClass: DrizzleSessionRepository },
    { provide: MessageRepository, useClass: DrizzleMessageRepository },
    { provide: EventRepository, useClass: DrizzleEventRepository },
    {
      provide: ProviderConfigRepository,
      useClass: DrizzleProviderConfigRepository,
    },
    { provide: ApiKeyRepository, useClass: DrizzleApiKeyRepository },
    {
      provide: WebhookEndpointRepository,
      useClass: DrizzleWebhookEndpointRepository,
    },
    { provide: WebhookLogRepository, useClass: DrizzleWebhookLogRepository },
    {
      provide: MessageTemplateRepository,
      useClass: DrizzleMessageTemplateRepository,
    },
    {
      provide: ScheduledMessageRepository,
      useClass: DrizzleScheduledMessageRepository,
    },
    {
      provide: AutoReplyRuleRepository,
      useClass: DrizzleAutoReplyRuleRepository,
    },
    { provide: ContactRepository, useClass: DrizzleContactRepository },
    {
      provide: BroadcastJobRepository,
      useClass: DrizzleBroadcastJobRepository,
    },
    { provide: UsageRepository, useClass: DrizzleUsageRepository },
    { provide: IpWhitelistRepository, useClass: DrizzleIpWhitelistRepository },
    {
      provide: SessionHealthRepository,
      useClass: DrizzleSessionHealthRepository,
    },
    { provide: TeamMemberRepository, useClass: DrizzleTeamMemberRepository },
  ],
  exports: [
    UserRepository,
    SessionRepository,
    MessageRepository,
    EventRepository,
    ProviderConfigRepository,
    ApiKeyRepository,
    WebhookEndpointRepository,
    WebhookLogRepository,
    MessageTemplateRepository,
    ScheduledMessageRepository,
    AutoReplyRuleRepository,
    ContactRepository,
    BroadcastJobRepository,
    UsageRepository,
    IpWhitelistRepository,
    SessionHealthRepository,
    TeamMemberRepository,
  ],
})
export class RepositoriesModule {}
