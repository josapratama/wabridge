// ─────────────────────────────────────────────
// Domain Models
// ─────────────────────────────────────────────

export type ProviderType = "meta-cloud" | "bsp" | "baileys";

export type SessionStatus = "active" | "inactive";

export type MessageDirection = "inbound" | "outbound";

export type MessageType =
  | "text"
  | "image"
  | "document"
  | "audio"
  | "video"
  | "location";

export type MessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "received";

// ─────────────────────────────────────────────
// Entities
// ─────────────────────────────────────────────

export interface Session {
  id: string;
  userId?: string;
  name: string;
  providerType: ProviderType;
  providerConfigId: string;
  status: SessionStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  externalMessageId?: string;
  direction: MessageDirection;
  from: string;
  to: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  mediaCaption?: string;
  mediaMimeType?: string;
  status: MessageStatus;
  rawPayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderEvent {
  id: string;
  sessionId?: string;
  providerType: ProviderType;
  eventType: string;
  payload: Record<string, unknown>;
  processed: boolean;
  createdAt: string;
}

export interface ProviderConfig {
  id: string;
  userId?: string;
  providerType: ProviderType;
  name: string;
  baseUrl?: string;
  apiVersion?: string;
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  verifyToken?: string;
  webhookSecret?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Provider Interface Commands & Results
// ─────────────────────────────────────────────

export interface ConnectAccountCommand {
  providerConfigId: string;
  sessionId: string;
  config: ProviderConfig;
}

export interface ProviderAccountResult {
  success: boolean;
  accountId?: string;
  message: string;
}

export interface VerifyWebhookQuery {
  mode?: string;
  token?: string;
  challenge?: string;
  [key: string]: string | undefined;
}

export interface VerifyWebhookResult {
  valid: boolean;
  challenge?: string;
}

export interface ProviderWebhookEvent {
  eventType: string;
  sessionId?: string;
  providerType: ProviderType;
  externalMessageId?: string;
  from?: string;
  to?: string;
  content?: string;
  messageType?: MessageType;
  mediaUrl?: string;
  status?: MessageStatus;
  timestamp?: string;
  rawPayload: Record<string, unknown>;
}

export interface SendTextMessageCommand {
  to: string;
  message: string;
  config: ProviderConfig;
  sessionId: string;
  // Media fields
  type?: "text" | "image" | "document" | "audio" | "video" | "location";
  mediaUrl?: string;
  mediaCaption?: string;
  mediaMimeType?: string;
  // Location fields
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface SendMessageResult {
  success: boolean;
  externalMessageId?: string;
  rawResponse?: Record<string, unknown>;
  error?: string;
}

export interface ProviderHealthResult {
  healthy: boolean;
  providerType: ProviderType;
  message: string;
  latencyMs?: number;
}

// ─────────────────────────────────────────────
// API Response Wrapper
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: { code: string; details: unknown } | null;
  timestamp: string;
}

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

// ─────────────────────────────────────────────
// Runtime sentinel — required for Bun module resolution.
// Bun cannot resolve files that export ONLY TypeScript types/interfaces.
// This object provides a runtime-visible export so the module resolves correctly.
// ─────────────────────────────────────────────
export const TYPES_MODULE = true;

export interface User {
  id: string;
  email: string;
  password?: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface WebhookEndpoint {
  id: string;
  userId: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  webhookEndpointId: string;
  eventType: string;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  durationMs?: number;
  attempt: number;
  success: boolean;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  userId: string;
  name: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledMessage {
  id: string;
  userId: string;
  sessionId: string;
  to: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  scheduledAt: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  messageId?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface AutoReplyRule {
  id: string;
  userId: string;
  sessionId?: string;
  name: string;
  matchType: "contains" | "exact" | "starts_with" | "regex";
  matchValue: string;
  replyContent: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  ownerId: string;
  memberId: string;
  role: "admin" | "operator" | "viewer";
  invitedAt: string;
  acceptedAt?: string;
  // joined from users
  memberEmail?: string;
  memberName?: string;
}

export interface UsageRecord {
  id: string;
  userId: string;
  month: string;
  messagesSent: number;
  messagesReceived: number;
  quotaLimit: number;
  updatedAt: string;
}

export interface IpWhitelist {
  id: string;
  apiKeyId: string;
  cidr: string;
  label?: string;
  createdAt: string;
}

export interface BroadcastJob {
  id: string;
  userId: string;
  sessionId: string;
  name: string;
  content: string;
  recipients: string[];
  delayMs: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  totalCount: number;
  sentCount: number;
  failedCount: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface SessionHealthLog {
  id: string;
  sessionId: string;
  status: "connected" | "disconnected" | "reconnecting";
  latencyMs?: number;
  messagesSentToday: number;
  messagesReceivedToday: number;
  checkedAt: string;
}

export interface AnalyticsSummary {
  totalSent: number;
  totalReceived: number;
  successRate: number;
  dailyStats: Array<{
    date: string;
    sent: number;
    received: number;
    failed: number;
  }>;
  statusBreakdown: Record<string, number>;
}
