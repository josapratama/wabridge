import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  bigint,
} from "drizzle-orm/pg-core";

export const users = pgTable("User", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const apiKeys = pgTable("ApiKey", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyHash: text("keyHash").notNull().unique(),
  keyPrefix: text("keyPrefix").notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const providerConfigs = pgTable("ProviderConfig", {
  id: text("id").primaryKey(),
  providerType: text("providerType").notNull(),
  name: text("name").notNull(),
  baseUrl: text("baseUrl"),
  apiVersion: text("apiVersion"),
  phoneNumberId: text("phoneNumberId"),
  wabaId: text("wabaId"),
  accessToken: text("accessToken"),
  verifyToken: text("verifyToken"),
  webhookSecret: text("webhookSecret"),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const sessions = pgTable("Session", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  providerType: text("providerType").notNull(),
  providerConfigId: text("providerConfigId")
    .notNull()
    .references(() => providerConfigs.id),
  status: text("status").default("inactive").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const messages = pgTable("Message", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId")
    .notNull()
    .references(() => sessions.id),
  externalMessageId: text("externalMessageId"),
  direction: text("direction").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  type: text("type").default("text").notNull(), // text | image | document | audio | video | location
  content: text("content").notNull(),
  mediaUrl: text("mediaUrl"),
  mediaCaption: text("mediaCaption"),
  mediaMimeType: text("mediaMimeType"),
  status: text("status").default("queued").notNull(),
  rawPayload: jsonb("rawPayload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const providerEvents = pgTable("ProviderEvent", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId"),
  providerType: text("providerType").notNull(),
  eventType: text("eventType").notNull(),
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Webhook Endpoints ─────────────────────────────────────────────────────────

export const webhookEndpoints = pgTable("WebhookEndpoint", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret"), // HMAC-SHA256 signing secret
  events: jsonb("events").notNull(), // string[] e.g. ["message.received", "message.sent"]
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const webhookLogs = pgTable("WebhookLog", {
  id: text("id").primaryKey(),
  webhookEndpointId: text("webhookEndpointId")
    .notNull()
    .references(() => webhookEndpoints.id, { onDelete: "cascade" }),
  eventType: text("eventType").notNull(),
  payload: jsonb("payload").notNull(),
  responseStatus: integer("responseStatus"),
  responseBody: text("responseBody"),
  durationMs: integer("durationMs"),
  attempt: integer("attempt").default(1).notNull(),
  success: boolean("success").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Message Templates ─────────────────────────────────────────────────────────

export const messageTemplates = pgTable("MessageTemplate", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  content: text("content").notNull(), // supports {{variable}} placeholders
  variables: jsonb("variables").notNull(), // string[] extracted variable names
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ── Scheduled Messages ────────────────────────────────────────────────────────

export const scheduledMessages = pgTable("ScheduledMessage", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("sessionId")
    .notNull()
    .references(() => sessions.id),
  to: text("to").notNull(),
  type: text("type").default("text").notNull(),
  content: text("content").notNull(),
  mediaUrl: text("mediaUrl"),
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: text("status").default("pending").notNull(), // pending | sent | failed | cancelled
  messageId: text("messageId"), // filled after sent
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Auto-reply Rules ──────────────────────────────────────────────────────────

export const autoReplyRules = pgTable("AutoReplyRule", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("sessionId").references(() => sessions.id), // null = apply to all sessions
  name: text("name").notNull(),
  matchType: text("matchType").notNull(), // contains | exact | starts_with | regex
  matchValue: text("matchValue").notNull(),
  replyContent: text("replyContent").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  priority: integer("priority").default(0).notNull(), // higher = checked first
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ── Rate Limiting ─────────────────────────────────────────────────────────────

export const rateLimitCounters = pgTable("RateLimitCounter", {
  id: text("id").primaryKey(),
  apiKeyId: text("apiKeyId")
    .notNull()
    .references(() => apiKeys.id, { onDelete: "cascade" }),
  windowStart: timestamp("windowStart").notNull(),
  windowType: text("windowType").notNull(), // "minute" | "hour" | "day"
  count: integer("count").default(0).notNull(),
});

// ── Contacts ──────────────────────────────────────────────────────────────────

export const contacts = pgTable("Contact", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  tags: jsonb("tags").notNull(), // string[]
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ── Team / Multi-user ─────────────────────────────────────────────────────────

export const teamMembers = pgTable("TeamMember", {
  id: text("id").primaryKey(),
  ownerId: text("ownerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  memberId: text("memberId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "admin" | "operator" | "viewer"
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
});

// ── Usage / Quota ─────────────────────────────────────────────────────────────

export const usageRecords = pgTable("UsageRecord", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // "2026-04"
  messagesSent: integer("messagesSent").default(0).notNull(),
  messagesReceived: integer("messagesReceived").default(0).notNull(),
  quotaLimit: integer("quotaLimit").default(1000).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ── IP Whitelist ──────────────────────────────────────────────────────────────

export const ipWhitelists = pgTable("IpWhitelist", {
  id: text("id").primaryKey(),
  apiKeyId: text("apiKeyId")
    .notNull()
    .references(() => apiKeys.id, { onDelete: "cascade" }),
  cidr: text("cidr").notNull(), // e.g. "192.168.1.0/24" or "1.2.3.4/32"
  label: text("label"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Broadcast Jobs ────────────────────────────────────────────────────────────

export const broadcastJobs = pgTable("BroadcastJob", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("sessionId")
    .notNull()
    .references(() => sessions.id),
  name: text("name").notNull(),
  content: text("content").notNull(),
  recipients: jsonb("recipients").notNull(), // string[] phone numbers
  delayMs: integer("delayMs").default(2000).notNull(),
  status: text("status").default("pending").notNull(), // pending|running|completed|failed|cancelled
  totalCount: integer("totalCount").default(0).notNull(),
  sentCount: integer("sentCount").default(0).notNull(),
  failedCount: integer("failedCount").default(0).notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Session Health ────────────────────────────────────────────────────────────

export const sessionHealthLogs = pgTable("SessionHealthLog", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // "connected"|"disconnected"|"reconnecting"
  latencyMs: integer("latencyMs"),
  messagesSentToday: integer("messagesSentToday").default(0).notNull(),
  messagesReceivedToday: integer("messagesReceivedToday").default(0).notNull(),
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
});
