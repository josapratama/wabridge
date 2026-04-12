/**
 * API client barrel — re-exports all domain modules.
 * Import from here for backward compatibility, or import directly from domain files.
 */

export { BASE, request } from "./base";
export type { ApiResponse } from "./base";

export { authApi } from "./auth";
export type { User, LoginResponse } from "./auth";

export { providerConfigsApi } from "./provider-configs";
export type {
  ProviderConfig,
  QrCodeResponse,
  PairingCodeResponse,
} from "./provider-configs";

export { sessionsApi } from "./sessions";
export type { Session } from "./sessions";

export { messagesApi } from "./messages";
export type { Message, SendMessageBody } from "./messages";

export { webhookEndpointsApi } from "./webhooks";
export type { WebhookEndpoint, WebhookLog } from "./webhooks";

export {
  messageTemplatesApi,
  scheduledMessagesApi,
  autoReplyApi,
} from "./automation";
export type {
  MessageTemplate,
  ScheduledMessage,
  AutoReplyRule,
} from "./automation";

export { contactsApi, broadcastApi } from "./contacts";
export type { Contact, BroadcastJob } from "./contacts";

export {
  analyticsApi,
  teamApi,
  sessionHealthApi,
  healthApi,
} from "./analytics";
export type {
  AnalyticsSummary,
  UsageRecord,
  TeamMember,
  SessionHealthLog,
  HealthResult,
} from "./analytics";

export { apiKeysApi, ipWhitelistApi, eventsApi } from "./api-keys";
export type { ApiKey, IpWhitelist, ProviderEvent } from "./api-keys";
