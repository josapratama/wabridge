import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import { MessagesService } from "../src/modules/messages/messages.service";
import { InMemoryMessageRepository } from "../src/repositories/in-memory/in-memory-message.repository";
import { InMemorySessionRepository } from "../src/repositories/in-memory/in-memory-session.repository";
import { InMemoryProviderConfigRepository } from "../src/repositories/in-memory/in-memory-provider-config.repository";
import { InMemoryEventRepository } from "../src/repositories/in-memory/in-memory-event.repository";
import { ProviderRoutingService } from "../src/modules/provider-routing/provider-routing.service";
import { EventsService } from "../src/modules/events/events.service";
import { AppLogger } from "../src/common/logger/app.logger";
import { HttpClient } from "../src/common/http/http-client";
import { MetaCloudWhatsAppProvider } from "../src/modules/providers/meta-cloud/meta-cloud.provider";
import { BspWhatsAppProvider } from "../src/modules/providers/bsp/bsp.provider";
import { BaileysWhatsAppProvider } from "../src/modules/providers/baileys/baileys.provider";
import { DefaultBspNormalizer } from "../src/modules/providers/bsp/default-bsp-normalizer";
import {
  MESSAGE_STATUS,
  PROVIDER_TYPES,
  SESSION_STATUS,
} from "../src/common/constants";
import type { ProviderConfig, Session } from "../src/common/types";

function buildDeps() {
  const logger = new AppLogger();
  const httpClient = new HttpClient(logger);
  const normalizer = new DefaultBspNormalizer();

  const messageRepo = new InMemoryMessageRepository();
  const sessionRepo = new InMemorySessionRepository();
  const configRepo = new InMemoryProviderConfigRepository();
  const eventRepo = new InMemoryEventRepository();

  const eventsService = new EventsService(eventRepo);

  const metaProvider = new MetaCloudWhatsAppProvider(httpClient, logger);
  const bspProvider = new BspWhatsAppProvider(httpClient, logger, normalizer);
  const mockAutoReply = { processIncomingMessage: async () => false } as any;
  const mockWebhook = { dispatch: async () => {} } as any;

  const baileysProvider = new BaileysWhatsAppProvider(
    logger,
    eventsService,
    messageRepo,
    mockAutoReply,
    mockWebhook,
  );

  const routingService = new ProviderRoutingService(
    metaProvider,
    bspProvider,
    baileysProvider,
    logger,
  );

  const service = new MessagesService(
    messageRepo,
    sessionRepo,
    configRepo,
    routingService,
    eventsService,
    mockWebhook,
    mockAutoReply,
    logger,
  );

  return {
    service,
    sessionRepo,
    configRepo,
    messageRepo,
    metaProvider,
    bspProvider,
    baileysProvider,
  };
}

const mockConfig: ProviderConfig = {
  id: "cfg-1",
  providerType: PROVIDER_TYPES.META_CLOUD,
  name: "Test Config",
  phoneNumberId: "123456789",
  accessToken: "test-token",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockSession: Session = {
  id: "session-1",
  name: "Test Session",
  providerType: PROVIDER_TYPES.META_CLOUD,
  providerConfigId: "cfg-1",
  status: SESSION_STATUS.ACTIVE,
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("MessagesService", () => {
  it("throws NotFoundException when session does not exist", async () => {
    const { service } = buildDeps();
    await expect(
      service.send({ sessionId: "nonexistent", to: "628123", message: "Hi" }),
    ).rejects.toThrow("Session nonexistent not found");
  });

  it("throws BadRequestException when session is inactive", async () => {
    const { service, sessionRepo, configRepo } = buildDeps();
    await configRepo.save(mockConfig);
    await sessionRepo.save({ ...mockSession, status: SESSION_STATUS.INACTIVE });

    await expect(
      service.send({ sessionId: "session-1", to: "628123", message: "Hi" }),
    ).rejects.toThrow("Session session-1 is not active");
  });

  it("throws BadRequestException when provider config is inactive", async () => {
    const { service, sessionRepo, configRepo } = buildDeps();
    await configRepo.save({ ...mockConfig, isActive: false });
    await sessionRepo.save(mockSession);

    await expect(
      service.send({ sessionId: "session-1", to: "628123", message: "Hi" }),
    ).rejects.toThrow("ProviderConfig cfg-1 is not active");
  });

  it("saves message as sent when provider succeeds", async () => {
    const { service, sessionRepo, configRepo, metaProvider } = buildDeps();
    await configRepo.save(mockConfig);
    await sessionRepo.save(mockSession);

    spyOn(metaProvider, "sendTextMessage").mockResolvedValue({
      success: true,
      externalMessageId: "wamid.test123",
    });

    const message = await service.send({
      sessionId: "session-1",
      to: "628123456789",
      message: "Hello",
    });

    expect(message.status).toBe(MESSAGE_STATUS.SENT);
    expect(message.externalMessageId).toBe("wamid.test123");
  });

  it("throws after all retries exhausted", async () => {
    const { service, sessionRepo, configRepo, metaProvider } = buildDeps();
    await configRepo.save(mockConfig);
    await sessionRepo.save(mockSession);

    process.env.RETRY_ATTEMPTS = "2";
    process.env.RETRY_DELAY_MS = "0";

    spyOn(metaProvider, "sendTextMessage").mockResolvedValue({
      success: false,
      error: "Provider unavailable",
    });

    await expect(
      service.send({ sessionId: "session-1", to: "628123", message: "Hi" }),
    ).rejects.toThrow(
      "Failed to send message after 3 attempts: Provider unavailable",
    );
  });

  it("findAll returns all messages", async () => {
    const { service } = buildDeps();
    const messages = await service.findAll();
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBe(0);
  });
});
