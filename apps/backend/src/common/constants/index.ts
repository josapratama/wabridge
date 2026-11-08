export const PROVIDER_TYPES = {
  META_CLOUD: "meta-cloud",
  BSP: "bsp",
  BAILEYS: "baileys",
} as const;

export const SESSION_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const MESSAGE_STATUS = {
  QUEUED: "queued",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
  RECEIVED: "received",
} as const;

export const MESSAGE_DIRECTION = {
  INBOUND: "inbound",
  OUTBOUND: "outbound",
} as const;

export const EVENT_TYPES = {
  MESSAGE_INBOUND: "message.inbound",
  MESSAGE_SENT: "message.sent",
  MESSAGE_DELIVERED: "message.delivered",
  MESSAGE_READ: "message.read",
  MESSAGE_FAILED: "message.failed",
  WEBHOOK_RECEIVED: "webhook.received",
  SEND_ERROR: "send.error",
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  PROVIDER_ERROR: "PROVIDER_ERROR",
  SEND_FAILED: "SEND_FAILED",
  WEBHOOK_INVALID: "WEBHOOK_INVALID",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  CONFIG_INACTIVE: "CONFIG_INACTIVE",
  SESSION_INACTIVE: "SESSION_INACTIVE",
} as const;

export const INJECTION_TOKENS = {
  SESSION_REPOSITORY: "SESSION_REPOSITORY",
  MESSAGE_REPOSITORY: "MESSAGE_REPOSITORY",
  EVENT_REPOSITORY: "EVENT_REPOSITORY",
  PROVIDER_CONFIG_REPOSITORY: "PROVIDER_CONFIG_REPOSITORY",
  WHATSAPP_PROVIDER: "WHATSAPP_PROVIDER",
} as const;

export const META_CLOUD_DEFAULTS = {
  BASE_URL: "https://graph.facebook.com",
  API_VERSION: "v19.0",
} as const;
