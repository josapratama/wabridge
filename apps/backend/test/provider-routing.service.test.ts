import { describe, it, expect, beforeEach } from "bun:test";
import { ProviderRoutingService } from "../src/modules/provider-routing/provider-routing.service";
import { MetaCloudWhatsAppProvider } from "../src/modules/providers/meta-cloud/meta-cloud.provider";
import { BspWhatsAppProvider } from "../src/modules/providers/bsp/bsp.provider";
import { BaileysWhatsAppProvider } from "../src/modules/providers/baileys/baileys.provider";
import { AppLogger } from "../src/common/logger/app.logger";
import { HttpClient } from "../src/common/http/http-client";
import { DefaultBspNormalizer } from "../src/modules/providers/bsp/default-bsp-normalizer";
import { EventsService } from "../src/modules/events/events.service";
import { InMemoryMessageRepository } from "../src/repositories/in-memory/in-memory-message.repository";
import { InMemoryEventRepository } from "../src/repositories/in-memory/in-memory-event.repository";

function makeLogger(): AppLogger {
  return new AppLogger();
}

function makeHttpClient(): HttpClient {
  return new HttpClient(makeLogger());
}

describe("ProviderRoutingService", () => {
  let service: ProviderRoutingService;
  let metaProvider: MetaCloudWhatsAppProvider;
  let bspProvider: BspWhatsAppProvider;
  let baileysProvider: BaileysWhatsAppProvider;

  beforeEach(() => {
    const logger = makeLogger();
    const httpClient = makeHttpClient();
    const normalizer = new DefaultBspNormalizer();
    const eventRepo = new InMemoryEventRepository();
    const eventsService = new EventsService(eventRepo);
    const messageRepo = new InMemoryMessageRepository();

    const mockAutoReply = { processIncomingMessage: async () => false } as any;
    const mockWebhook = { dispatch: async () => {} } as any;

    metaProvider = new MetaCloudWhatsAppProvider(httpClient, logger);
    bspProvider = new BspWhatsAppProvider(httpClient, logger, normalizer);
    baileysProvider = new BaileysWhatsAppProvider(
      logger,
      eventsService,
      messageRepo,
      mockAutoReply,
      mockWebhook,
    );
    service = new ProviderRoutingService(
      metaProvider,
      bspProvider,
      baileysProvider,
      logger,
    );
  });

  it("returns MetaCloudWhatsAppProvider for meta-cloud", () => {
    const provider = service.getProvider("meta-cloud");
    expect(provider).toBe(metaProvider);
  });

  it("returns BspWhatsAppProvider for bsp", () => {
    const provider = service.getProvider("bsp");
    expect(provider).toBe(bspProvider);
  });

  it("returns BaileysWhatsAppProvider for baileys", () => {
    const provider = service.getProvider("baileys");
    expect(provider).toBe(baileysProvider);
  });

  it("throws NotFoundException for unknown provider type", () => {
    expect(() => service.getProvider("unknown" as never)).toThrow();
  });

  it("returns all available provider types", () => {
    const types = service.getAvailableProviders();
    expect(types).toContain("meta-cloud");
    expect(types).toContain("bsp");
    expect(types).toContain("baileys");
    expect(types.length).toBe(3);
  });
});
