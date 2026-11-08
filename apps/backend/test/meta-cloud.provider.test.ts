import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import { MetaCloudWhatsAppProvider } from "../src/modules/providers/meta-cloud/meta-cloud.provider";
import { AppLogger } from "../src/common/logger/app.logger";
import { HttpClient } from "../src/common/http/http-client";
import { ProviderConfig } from "../src/common/types";

const mockConfig: ProviderConfig = {
  id: "cfg-1",
  providerType: "meta-cloud",
  name: "Test Meta Config",
  baseUrl: "https://graph.facebook.com",
  apiVersion: "v19.0",
  phoneNumberId: "123456789",
  accessToken: "test-token",
  verifyToken: "my-verify-token",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("MetaCloudWhatsAppProvider", () => {
  let provider: MetaCloudWhatsAppProvider;
  let httpClient: HttpClient;
  let logger: AppLogger;

  beforeEach(() => {
    logger = new AppLogger();
    httpClient = new HttpClient(logger);
    provider = new MetaCloudWhatsAppProvider(httpClient, logger);
  });

  describe("verifyWebhook", () => {
    it("returns valid=true with challenge when mode=subscribe", async () => {
      const result = await provider.verifyWebhook({
        "hub.mode": "subscribe",
        "hub.verify_token": "my-verify-token",
        "hub.challenge": "abc123",
      });
      expect(result.valid).toBe(true);
      expect(result.challenge).toBe("abc123");
    });

    it("returns valid=false when mode is missing", async () => {
      const result = await provider.verifyWebhook({
        "hub.verify_token": "my-verify-token",
      });
      expect(result.valid).toBe(false);
    });

    it("returns valid=false when challenge is missing", async () => {
      const result = await provider.verifyWebhook({
        "hub.mode": "subscribe",
        "hub.verify_token": "my-verify-token",
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("handleWebhook", () => {
    it("parses inbound text message correctly", async () => {
      const payload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "entry-1",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: "+1234567890",
                    phone_number_id: "123456789",
                  },
                  messages: [
                    {
                      from: "628123456789",
                      id: "wamid.abc123",
                      timestamp: "1700000000",
                      type: "text",
                      text: { body: "Hello World" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const events = await provider.handleWebhook(payload);
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe("message.inbound");
      expect(events[0].content).toBe("Hello World");
      expect(events[0].from).toBe("628123456789");
      expect(events[0].externalMessageId).toBe("wamid.abc123");
    });

    it("parses status update correctly", async () => {
      const payload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "entry-1",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: "+1234567890",
                    phone_number_id: "123456789",
                  },
                  statuses: [
                    {
                      id: "wamid.abc123",
                      status: "delivered",
                      timestamp: "1700000001",
                      recipient_id: "628123456789",
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const events = await provider.handleWebhook(payload);
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe("message.delivered");
      expect(events[0].status).toBe("delivered");
    });

    it("returns empty array for non-whatsapp payload", async () => {
      const events = await provider.handleWebhook({
        object: "page",
        entry: [],
      });
      expect(events.length).toBe(0);
    });
  });

  describe("sendTextMessage", () => {
    it("returns error when phoneNumberId is missing", async () => {
      const result = await provider.sendTextMessage({
        to: "628123456789",
        message: "Hello",
        config: { ...mockConfig, phoneNumberId: undefined },
        sessionId: "session-1",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("calls correct Meta API endpoint and returns success", async () => {
      const mockResponse = {
        messaging_product: "whatsapp",
        contacts: [{ input: "628123456789", wa_id: "628123456789" }],
        messages: [{ id: "wamid.newmessage123" }],
      };

      spyOn(httpClient, "post").mockResolvedValue({
        status: 200,
        data: mockResponse,
        headers: {},
      });

      const result = await provider.sendTextMessage({
        to: "628123456789",
        message: "Hello",
        config: mockConfig,
        sessionId: "session-1",
      });

      expect(result.success).toBe(true);
      expect(result.externalMessageId).toBe("wamid.newmessage123");
    });

    it("returns failure when API returns non-200", async () => {
      spyOn(httpClient, "post").mockResolvedValue({
        status: 400,
        data: { error: { message: "Invalid token" } },
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
