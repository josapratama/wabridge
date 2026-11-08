import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  logLevel: process.env.LOG_LEVEL ?? "info",
  storageMode: process.env.STORAGE_MODE ?? "memory",
  defaultProviderTimeoutMs: parseInt(
    process.env.DEFAULT_PROVIDER_TIMEOUT_MS ?? "10000",
    10,
  ),
  retry: {
    attempts: parseInt(process.env.RETRY_ATTEMPTS ?? "3", 10),
    delayMs: parseInt(process.env.RETRY_DELAY_MS ?? "1000", 10),
  },
  meta: {
    graphBaseUrl:
      process.env.META_GRAPH_BASE_URL ?? "https://graph.facebook.com",
    apiVersion: process.env.META_API_VERSION ?? "v19.0",
    accessToken: process.env.META_ACCESS_TOKEN,
    phoneNumberId: process.env.META_PHONE_NUMBER_ID,
    verifyToken: process.env.META_VERIFY_TOKEN,
    appSecret: process.env.META_APP_SECRET,
  },
  bsp: {
    baseUrl: process.env.BSP_BASE_URL,
    accessToken: process.env.BSP_ACCESS_TOKEN,
    verifyToken: process.env.BSP_VERIFY_TOKEN,
    webhookSecret: process.env.BSP_WEBHOOK_SECRET,
  },
}));

export type AppConfig = ReturnType<typeof appConfig>;
