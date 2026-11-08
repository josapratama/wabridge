import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "../src/app.module";
import supertest from "supertest";
import { PROVIDER_TYPES } from "../src/common/constants";

let app: INestApplication;
let providerConfigId: string;
let baileysProviderConfigId: string;
let sessionId: string;

beforeAll(async () => {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();

  // const mockLogger = {
  //   log: () => {},
  //   error: () => {},
  //   warn: () => {},
  //   debug: () => {},
  //   logStructured: () => {},
  // } as unknown as AppLogger;

  // app.useGlobalFilters(new GlobalExceptionFilter(mockLogger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
}, 30000); // Increase timeout for beforeAll

afterAll(async () => {
  await app.close();
}, 10000);

describe("GET /health", () => {
  it("returns 200 with health status", async () => {
    const res = await supertest(app.getHttpServer()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toMatch(/ok|degraded/);
  });
});

describe("POST /provider-configs", () => {
  it("creates a meta-cloud provider config", async () => {
    const res = await supertest(app.getHttpServer())
      .post("/provider-configs")
      .send({
        providerType: PROVIDER_TYPES.META_CLOUD,
        name: "My Meta Config",
        accessToken: "test-access-token",
        phoneNumberId: "123456789",
        verifyToken: "my-verify-token",
        apiVersion: "v19.0",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    providerConfigId = res.body.data.id as string;
  });

  it("creates a baileys provider config", async () => {
    const res = await supertest(app.getHttpServer())
      .post("/provider-configs")
      .send({
        providerType: PROVIDER_TYPES.BAILEYS,
        name: "My Baileys Config",
        accessToken: "baileys-token", // Access token is not strictly used by Baileys provider for connection
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    baileysProviderConfigId = res.body.data.id as string;
  });

  it("returns 400 for missing required fields", async () => {
    const res = await supertest(app.getHttpServer())
      .post("/provider-configs")
      .send({ providerType: PROVIDER_TYPES.META_CLOUD });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("PATCH /provider-configs/:id/activate", () => {
  it("activates the meta-cloud provider config", async () => {
    const res = await supertest(app.getHttpServer()).patch(
      `/provider-configs/${providerConfigId}/activate`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(true);
  });

  it("activates the baileys provider config and initiates QR generation", async () => {
    const res = await supertest(app.getHttpServer()).patch(
      `/provider-configs/${baileysProviderConfigId}/activate`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(true);
  });
});

describe("GET /provider-configs/:id/qr", () => {
  it("returns QR code data for baileys provider", async () => {
    const res = await supertest(app.getHttpServer()).get(
      `/provider-configs/${baileysProviderConfigId}/qr`,
    );
    expect(res.status).toBe(200);
    expect(res.body.qrCode).toBeDefined(); // QR code should be generated
  });

  it("returns undefined QR code for non-baileys provider", async () => {
    const res = await supertest(app.getHttpServer()).get(
      `/provider-configs/${providerConfigId}/qr`,
    );
    expect(res.status).toBe(200);
    expect(res.body.qrCode).toBeUndefined();
  });
});

describe("POST /sessions", () => {
  it("creates a session linked to provider config", async () => {
    const res = await supertest(app.getHttpServer())
      .post("/sessions")
      .send({ name: "Test Session", providerConfigId });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("active");
    sessionId = res.body.data.id as string;
  });

  it("returns 400 for invalid providerConfigId", async () => {
    const res = await supertest(app.getHttpServer())
      .post("/sessions")
      .send({ name: "Bad Session", providerConfigId: "not-a-uuid" });
    expect(res.status).toBe(400);
  });
});

describe("GET /sessions", () => {
  it("returns list of sessions", async () => {
    const res = await supertest(app.getHttpServer()).get("/sessions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /webhooks/meta-cloud (verification)", () => {
  it("returns 400 when no active config exists for bsp", async () => {
    const res = await supertest(app.getHttpServer()).get(
      "/webhooks/bsp?hub.mode=subscribe&hub.verify_token=test&hub.challenge=abc",
    );
    expect(res.status).toBe(400);
  });

  it("returns challenge when token matches", async () => {
    const res = await supertest(app.getHttpServer()).get(
      "/webhooks/meta-cloud?hub.mode=subscribe&hub.verify_token=my-verify-token&hub.challenge=challenge123",
    );
    expect(res.status).toBe(200);
    expect(res.text).toContain("challenge123");
  });
});

describe("POST /webhooks/meta-cloud", () => {
  it("processes inbound message webhook", async () => {
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
                    id: "wamid.inbound001",
                    timestamp: "1700000000",
                    type: "text",
                    text: { body: "Hello from user" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res = await supertest(app.getHttpServer())
      .post("/webhooks/meta-cloud")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.processed).toBe(1);
  });
});

describe("POST /webhooks/bsp", () => {
  it("processes generic BSP webhook", async () => {
    const payload = {
      event: "message.inbound",
      messageId: "bsp-001",
      from: "628111222333",
      to: "628999888777",
      type: "text",
      text: "Hello from BSP user",
      timestamp: new Date().toISOString(),
    };

    const res = await supertest(app.getHttpServer())
      .post("/webhooks/bsp")
      .send(payload);

    expect(res.status).toBe(201);
  });
});

describe("GET /events", () => {
  it("returns list of recorded events", async () => {
    const res = await supertest(app.getHttpServer()).get("/events");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe("POST /messages/send (validation)", () => {
  it("returns 400 when message exceeds 4096 chars", async () => {
    const res = await supertest(app.getHttpServer())
      .post("/messages/send")
      .send({
        sessionId,
        to: "628123456789",
        message: "a".repeat(4097),
      });
    expect(res.status).toBe(400);
  });
});
