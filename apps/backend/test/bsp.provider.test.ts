import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import { BspWhatsAppProvider } from "../src/modules/providers/bsp/bsp.provider";
import { DefaultBspNormalizer } from "../src/modules/providers/bsp/default-bsp-normalizer";
import { AppLogger } from "../src/common/logger/app.logger";
import { HttpClient } from "../src/common/http/http-client";
import { ProviderConfig } from "../src/common/types";

const mockConfig: ProviderConfig = {
  id: "cfg-bsp-1",
  providerType: "bsp",
  name: "Test BSP Config",
  baseUrl: "https://bsp.example.com/api",
  accessToken: "bsp-token",
  verifyToken: "bsp-verify-token",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("BspWhatsAppProvider", () => {
  let provider: BspWhatsAppProvider;
  let httpClient: HttpClient;
  let logger: AppLogger;
  let normalizer: DefaultBspNormalizer;

  beforeEach(() => {
    logger = new AppLogger();
    httpClient = new HttpClient(logger);
    normalizer = new DefaultBspNormalizer();
    provider = new BspWhatsAppProvider(httpClient, logger, normalizer);
  });

  describe("verifyWebhook", () => {
    it("returns valid=true when token and challenge present", async () => {
      const result = await provider.verifyWebhook({
        token: "bsp-verify-token",
        challenge: "xyz789",
      });
      expect(result.valid).toBe(true);
      expect(result.challenge).toBe("xyz789");
    });

    it("returns valid=true with hub.* params", async () => {
      const result = await provider.verifyWebhook({
        "hub.mode": "subscribe",
        "hub.verify_token": "bsp-verify-token",
        "hub.challenge": "xyz789",
      });
      expect(result.valid).toBe(true);
    });

    it("returns valid=false when no token", async () => {
      const result = await provider.verifyWebhook({});
      expect(result.valid).toBe(false);
    });
  });

  describe("handleWebhook", () => {
    it("parses inbound message via DefaultBspNormalizer", async () => {
      const payload = {
        event: "message.inbound",
        messageId: "bsp-msg-001",
        from: "628111222333",
        to: "628999888777",
        type: "text",
        text: "Hi from BSP",
        timestamp: "2024-01-01T00:00:00Z",
      };

      const events = await provider.handleWebhook(payload);
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe("message.inbound");
      expect(events[0].content).toBe("Hi from BSP");
      expect(events[0].from).toBe("628111222333");
    });

    it("parses status update via DefaultBspNormalizer", async () => {
      const payload = {
        event: "message.status",
        messageId: "bsp-msg-001",
        to: "628111222333",
        status: "delivered",
        timestamp: "2024-01-01T00:01:00Z",
      };

      const events = await provider.handleWebhook(payload);
      expect(events.length).toBe(1);
      expect(events[0].status).toBe("delivered");
    });

    it("returns unknown event for unrecognized payload", async () => {
      const events = await provider.handleWebhook({
        event: "custom.event",
        data: {},
      });
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe("custom.event");
    });

    it("returns webhook.unknown for payload without event field", async () => {
      const events = await provider.handleWebhook({ foo: "bar" });
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe("webhook.unknown");
    });
  });

  describe("sendTextMessage", () => {
    it("returns error when baseUrl is missing", async () => {
      const result = await provider.sendTextMessage({
        to: "628123456789",
        message: "Hello",
        config: { ...mockConfig, baseUrl: undefined },
        sessionId: "session-1",
      });
      expect(result.success).toBe(false);
    });

    it("returns success when BSP API responds 200", async () => {
      spyOn(httpClient, "post").mockResolvedValue({
        status: 200,
        data: { messageId: "bsp-ext-001", status: "queued" },
        headers: {},
      });

      const result = await provider.sendTextMessage({
        to: "628123456789",
        message: "Hello BSP",
        config: mockConfig,
        sessionId: "session-1",
      });

      expect(result.success).toBe(true);
      expect(result.externalMessageId).toBe("bsp-ext-001");
    });

    it("returns failure when BSP API responds 401", async () => {
      spyOn(httpClient, "post").mockResolvedValue({
        status: 401,
        data: { error: "Unauthorized" },
        headers: {},
      });

      const result = await provider.sendTextMessage({
        to: "628123456789",
        message: "Hello",
        config: mockConfig,
        sessionId: "session-1",
      });

      expect(result.success).toBe(false);
    });
  });
});
