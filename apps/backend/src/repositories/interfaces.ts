/**
 * Repository abstract classes.
 *
 * Using abstract classes instead of interfaces because:
 * 1. Abstract classes compile to real JavaScript (classes), so they can be
 *    used as NestJS injection tokens without string tokens.
 * 2. Bun's module resolver can find them as named exports.
 * 3. Swapping implementations = change useClass in repositories.module.ts only.
 */

import type {
  Message,
  ProviderConfig,
  ProviderEvent,
  Session,
  User,
  ApiKey,
  WebhookEndpoint,
  WebhookLog,
  MessageTemplate,
  ScheduledMessage,
  AutoReplyRule,
  Contact,
  BroadcastJob,
  UsageRecord,
  IpWhitelist,
  SessionHealthLog,
  TeamMember,
} from "../common/types";

export abstract class BaseRepository<T> {
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract save(entity: T): Promise<T>;
  abstract update(id: string, partial: Partial<T>): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;
}

export abstract class UserRepository extends BaseRepository<User> {
  abstract findByEmail(email: string): Promise<User | null>;
}

export abstract class SessionRepository extends BaseRepository<Session> {
  abstract findByProviderConfigId(providerConfigId: string): Promise<Session[]>;
  abstract findAllByUserId(userId: string): Promise<Session[]>;
}

export abstract class MessageRepository extends BaseRepository<Message> {
  abstract findBySessionId(sessionId: string): Promise<Message[]>;
  abstract findByExternalMessageId(
    externalMessageId: string,
  ): Promise<Message | null>;
  abstract findRecentByJid(jid: string, limit?: number): Promise<Message[]>;
}

export abstract class EventRepository extends BaseRepository<ProviderEvent> {
  abstract findBySessionId(sessionId: string): Promise<ProviderEvent[]>;
  abstract findUnprocessed(): Promise<ProviderEvent[]>;
}

export abstract class ProviderConfigRepository extends BaseRepository<ProviderConfig> {
  abstract findByProviderType(providerType: string): Promise<ProviderConfig[]>;
  abstract findActiveByProviderType(
    providerType: string,
  ): Promise<ProviderConfig | null>;
  abstract findAllByUserId(userId: string): Promise<ProviderConfig[]>;
}

export abstract class ApiKeyRepository {
  abstract findById(id: string): Promise<ApiKey | null>;
  abstract findByHash(keyHash: string): Promise<ApiKey | null>;
  abstract findAllByUserId(userId: string): Promise<ApiKey[]>;
  abstract save(entity: ApiKey): Promise<ApiKey>;
  abstract updateLastUsed(id: string): Promise<void>;
  abstract revoke(id: string): Promise<void>;
}

export abstract class WebhookEndpointRepository {
  abstract findById(id: string): Promise<WebhookEndpoint | null>;
  abstract findAllByUserId(userId: string): Promise<WebhookEndpoint[]>;
  abstract findActiveAll(): Promise<WebhookEndpoint[]>;
  abstract save(entity: WebhookEndpoint): Promise<WebhookEndpoint>;
  abstract update(
    id: string,
    partial: Partial<WebhookEndpoint>,
  ): Promise<WebhookEndpoint | null>;
  abstract delete(id: string): Promise<void>;
}

export abstract class WebhookLogRepository {
  abstract save(entity: WebhookLog): Promise<WebhookLog>;
  abstract findById(id: string): Promise<WebhookLog | null>;
  abstract findByEndpointId(
    endpointId: string,
    limit?: number,
  ): Promise<WebhookLog[]>;
  abstract findRecentLogs(limit?: number): Promise<WebhookLog[]>;
}

export abstract class MessageTemplateRepository {
  abstract findById(id: string): Promise<MessageTemplate | null>;
  abstract findAllByUserId(userId: string): Promise<MessageTemplate[]>;
  abstract save(entity: MessageTemplate): Promise<MessageTemplate>;
  abstract update(
    id: string,
    partial: Partial<MessageTemplate>,
  ): Promise<MessageTemplate | null>;
  abstract delete(id: string): Promise<void>;
}

export abstract class ScheduledMessageRepository {
  abstract findById(id: string): Promise<ScheduledMessage | null>;
  abstract findAllByUserId(userId: string): Promise<ScheduledMessage[]>;
  abstract findDuePending(): Promise<ScheduledMessage[]>;
  abstract save(entity: ScheduledMessage): Promise<ScheduledMessage>;
  abstract update(
    id: string,
    partial: Partial<ScheduledMessage>,
  ): Promise<ScheduledMessage | null>;
  abstract delete(id: string): Promise<void>;
}

export abstract class AutoReplyRuleRepository {
  abstract findById(id: string): Promise<AutoReplyRule | null>;
  abstract findAllByUserId(userId: string): Promise<AutoReplyRule[]>;
  abstract findActiveForSession(sessionId: string): Promise<AutoReplyRule[]>;
  abstract save(entity: AutoReplyRule): Promise<AutoReplyRule>;
  abstract update(
    id: string,
    partial: Partial<AutoReplyRule>,
  ): Promise<AutoReplyRule | null>;
  abstract delete(id: string): Promise<void>;
}

export abstract class ContactRepository {
  abstract findById(id: string): Promise<Contact | null>;
  abstract findAllByUserId(userId: string): Promise<Contact[]>;
  abstract findByPhone(userId: string, phone: string): Promise<Contact | null>;
  abstract save(entity: Contact): Promise<Contact>;
  abstract update(
    id: string,
    partial: Partial<Contact>,
  ): Promise<Contact | null>;
  abstract delete(id: string): Promise<void>;
}

export abstract class BroadcastJobRepository {
  abstract findById(id: string): Promise<BroadcastJob | null>;
  abstract findAllByUserId(userId: string): Promise<BroadcastJob[]>;
  abstract findRunningJobs(): Promise<BroadcastJob[]>;
  abstract save(entity: BroadcastJob): Promise<BroadcastJob>;
  abstract update(
    id: string,
    partial: Partial<BroadcastJob>,
  ): Promise<BroadcastJob | null>;
}

export abstract class UsageRepository {
  abstract findByUserAndMonth(
    userId: string,
    month: string,
  ): Promise<UsageRecord | null>;
  abstract findAllByUserId(userId: string): Promise<UsageRecord[]>;
  abstract upsert(
    userId: string,
    month: string,
    delta: { sent?: number; received?: number },
  ): Promise<UsageRecord>;
}

export abstract class IpWhitelistRepository {
  abstract findByApiKeyId(apiKeyId: string): Promise<IpWhitelist[]>;
  abstract save(entity: IpWhitelist): Promise<IpWhitelist>;
  abstract delete(id: string): Promise<void>;
}

export abstract class SessionHealthRepository {
  abstract save(entity: SessionHealthLog): Promise<SessionHealthLog>;
  abstract findLatestBySessionId(
    sessionId: string,
  ): Promise<SessionHealthLog | null>;
  abstract findAllLatest(): Promise<SessionHealthLog[]>;
}

export abstract class TeamMemberRepository {
  abstract findByOwnerId(ownerId: string): Promise<TeamMember[]>;
  abstract save(entity: TeamMember): Promise<TeamMember>;
  abstract delete(id: string): Promise<void>;
  abstract updateRole(id: string, role: string): Promise<void>;
}
