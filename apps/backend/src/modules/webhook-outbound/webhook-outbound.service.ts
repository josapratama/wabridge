import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { createHmac } from "crypto";
import { v4 as uuidv4 } from "uuid";
import {
  WebhookEndpointRepository,
  WebhookLogRepository,
} from "../../repositories/interfaces";
import { WebhookEndpoint, WebhookLog } from "../../common/types";
import { CreateWebhookDto, UpdateWebhookDto } from "./dto/create-webhook.dto";
import { AppLogger } from "../../common/logger/app.logger";

@Injectable()
export class WebhookOutboundService {
  constructor(
    @Inject(WebhookEndpointRepository)
    private readonly endpointRepo: WebhookEndpointRepository,
    @Inject(WebhookLogRepository)
    private readonly logRepo: WebhookLogRepository,
    private readonly logger: AppLogger,
  ) {}

  async create(
    userId: string,
    dto: CreateWebhookDto,
  ): Promise<WebhookEndpoint> {
    return this.endpointRepo.save({
      id: uuidv4(),
      userId,
      name: dto.name,
      url: dto.url,
      secret: dto.secret,
      events: dto.events,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async list(userId: string): Promise<WebhookEndpoint[]> {
    return this.endpointRepo.findAllByUserId(userId);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateWebhookDto,
  ): Promise<WebhookEndpoint> {
    const endpoint = await this.endpointRepo.findById(id);
    if (!endpoint) throw new NotFoundException("Webhook not found");
    if (endpoint.userId !== userId) throw new ForbiddenException();
    const updated = await this.endpointRepo.update(id, dto);
    return updated!;
  }

  async delete(id: string, userId: string): Promise<void> {
    const endpoint = await this.endpointRepo.findById(id);
    if (!endpoint) throw new NotFoundException("Webhook not found");
    if (endpoint.userId !== userId) throw new ForbiddenException();
    await this.endpointRepo.delete(id);
  }

  async getLogs(endpointId: string, userId: string): Promise<WebhookLog[]> {
    const endpoint = await this.endpointRepo.findById(endpointId);
    if (!endpoint) throw new NotFoundException("Webhook not found");
    if (endpoint.userId !== userId) throw new ForbiddenException();
    return this.logRepo.findByEndpointId(endpointId);
  }

  async getAllLogs(userId: string, limit = 100): Promise<WebhookLog[]> {
    return this.logRepo.findRecentLogs(limit);
  }

  async testEndpoint(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; statusCode?: number; latencyMs: number; error?: string }> {
    const endpoint = await this.endpointRepo.findById(id);
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");
    if (endpoint.userId !== userId) throw new ForbiddenException();

    const start = Date.now();
    const testPayload = {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      data: {
        message: "Test ping from WaBridge WhatsApp Gateway",
        endpointId: endpoint.id,
        endpointName: endpoint.name,
      },
    };
    const body = JSON.stringify(testPayload);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (endpoint.secret) {
        headers["X-Webhook-Signature"] =
          `sha256=${createHmac("sha256", endpoint.secret).update(body).digest("hex")}`;
      }

      const res = await fetch(endpoint.url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(10000),
      });

      const latencyMs = Date.now() - start;
      const text = await res.text().catch(() => "");

      await this.logRepo.save({
        id: uuidv4(),
        webhookEndpointId: endpoint.id,
        eventType: "webhook.test",
        payload: testPayload,
        responseStatus: res.status,
        responseBody: text.slice(0, 500),
        attempt: 1,
        durationMs: latencyMs,
        success: res.ok,
        createdAt: new Date().toISOString(),
      });

      return {
        success: res.ok,
        statusCode: res.status,
        latencyMs,
        error: res.ok ? undefined : `HTTP ${res.status}: ${text.slice(0, 100)}`,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return {
        success: false,
        latencyMs,
        error: err?.message || "Failed to reach endpoint",
      };
    }
  }

  async retry(
    logId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const log = await this.logRepo.findById(logId);
    if (!log) throw new NotFoundException("Webhook log not found");
    const endpoint = await this.endpointRepo.findById(log.webhookEndpointId);
    if (!endpoint) throw new NotFoundException("Webhook endpoint not found");
    if (endpoint.userId !== userId) throw new ForbiddenException();

    void this.deliverWithRetry(endpoint, log.eventType, log.payload, 1);
    return { success: true, message: "Webhook retry initiated" };
  }

  /**
   * Dispatch an event to all active webhook endpoints that subscribed to it.
   * Called internally when events occur (message received, sent, etc.)
   */
  async dispatch(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const endpoints = await this.endpointRepo.findActiveAll();
    const matching = endpoints.filter(
      (e) => e.events.includes(eventType) || e.events.includes("*"),
    );

    await Promise.allSettled(
      matching.map((endpoint) =>
        this.deliverWithRetry(endpoint, eventType, payload),
      ),
    );
  }

  private async deliverWithRetry(
    endpoint: WebhookEndpoint,
    eventType: string,
    payload: Record<string, unknown>,
    maxAttempts = 3,
  ): Promise<void> {
    const body = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const start = Date.now();
      let responseStatus: number | undefined;
      let responseBody: string | undefined;
      let success = false;

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (endpoint.secret) {
          headers["X-Webhook-Signature"] =
            `sha256=${createHmac("sha256", endpoint.secret).update(body).digest("hex")}`;
        }

        const res = await fetch(endpoint.url, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(10000),
        });
        responseStatus = res.status;
        responseBody = await res.text().catch(() => "");
        success = res.ok;
      } catch (err) {
        responseBody = err instanceof Error ? err.message : "Unknown error";
      }

      const durationMs = Date.now() - start;

      await this.logRepo.save({
        id: uuidv4(),
        webhookEndpointId: endpoint.id,
        eventType,
        payload,
        responseStatus,
        responseBody,
        durationMs,
        attempt,
        success,
        createdAt: new Date().toISOString(),
      });

      if (success) return;

      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt)); // exponential backoff
      }
    }

    this.logger.warn(
      `Webhook ${endpoint.id} failed after ${maxAttempts} attempts`,
      "WebhookOutbound",
    );
  }
}
