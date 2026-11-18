import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { EVENT_TYPES, MESSAGE_STATUS } from "../../common/constants";
import type { Message, SendTextMessageCommand } from "../../common/types";
import {
  MessageRepository,
  ProviderConfigRepository,
  SessionRepository,
  UsageRepository,
} from "../../repositories/interfaces";
import { ProviderRoutingService } from "../provider-routing/provider-routing.service";
import { EventsService } from "../events/events.service";
import { AppLogger } from "../../common/logger/app.logger";
import { SendMessageDto } from "./dto/send-message.dto";

import { WebhookOutboundService } from "../webhook-outbound/webhook-outbound.service";
import { AutoReplyService } from "../auto-reply/auto-reply.service";

@Injectable()
export class MessagesService {
  private readonly retryAttempts: number;
  private readonly retryDelayMs: number;

  constructor(
    @Inject(MessageRepository)
    private readonly messageRepo: MessageRepository,
    @Inject(SessionRepository)
    private readonly sessionRepo: SessionRepository,
    @Inject(ProviderConfigRepository)
    private readonly configRepo: ProviderConfigRepository,
    private readonly routingService: ProviderRoutingService,
    private readonly eventsService: EventsService,
    private readonly webhookService: WebhookOutboundService,
    private readonly autoReplyService: AutoReplyService,
    private readonly logger: AppLogger,
    @Optional()
    @Inject(UsageRepository)
    private readonly usageRepo?: UsageRepository,
  ) {
    this.retryAttempts = parseInt(process.env.RETRY_ATTEMPTS ?? "3", 10);
    this.retryDelayMs = parseInt(process.env.RETRY_DELAY_MS ?? "1000", 10);
  }

  async send(dto: SendMessageDto, userId?: string): Promise<Message> {
    // 1. Validate session
    const session = await this.sessionRepo.findById(dto.sessionId);
    if (!session)
      throw new NotFoundException(`Session ${dto.sessionId} not found`);
    if (userId && session.userId && session.userId !== userId) {
      throw new BadRequestException(`Session ${dto.sessionId} does not belong to your account`);
    }
    if (session.status !== "active") {
      throw new BadRequestException(`Session ${dto.sessionId} is not active`);
    }

    // 2. Get provider config
    const config = await this.configRepo.findById(session.providerConfigId);
    if (!config) {
      throw new NotFoundException(
        `ProviderConfig ${session.providerConfigId} not found`,
      );
    }
    if (!config.isActive) {
      throw new BadRequestException(
        `ProviderConfig ${config.id} is not active`,
      );
    }

    // 3. Get provider implementation
    const provider = this.routingService.getProvider(session.providerType);

    // 4. Save message with queued status
    const now = new Date().toISOString();
    let message: Message = await this.messageRepo.save({
      id: uuidv4(),
      sessionId: dto.sessionId,
      direction: "outbound",
      from: config.phoneNumberId ?? "system",
      to: dto.to,
      type: (dto.type as Message["type"]) ?? "text",
      content: dto.message,
      mediaUrl: dto.mediaUrl,
      mediaCaption: dto.mediaCaption,
      mediaMimeType: dto.mediaMimeType,
      status: MESSAGE_STATUS.QUEUED,
      createdAt: now,
      updatedAt: now,
    });

    // 5. Send with retry
    let lastError = "";
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        this.logger.logStructured(
          "info",
          `Sending message attempt ${attempt}/${this.retryAttempts}`,
          { messageId: message.id, to: dto.to },
          "MessagesService",
        );

        const result = await provider.sendTextMessage({
          to: dto.to,
          message: dto.message,
          config,
          sessionId: dto.sessionId,
          type: dto.type as SendTextMessageCommand["type"],
          mediaUrl: dto.mediaUrl,
          mediaCaption: dto.mediaCaption,
          mediaMimeType: dto.mediaMimeType,
          latitude: dto.latitude,
          longitude: dto.longitude,
          locationName: dto.locationName,
          quotedMessageId: dto.quotedMessageId,
        });

        if (result.success) {
          message =
            (await this.messageRepo.update(message.id, {
              status: MESSAGE_STATUS.SENT,
              externalMessageId: result.externalMessageId,
              rawPayload: result.rawResponse,
            })) ?? message;

          if (this.usageRepo && session.userId) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            void this.usageRepo
              .upsert(session.userId, currentMonth, { sent: 1 })
              .catch(() => {});
          }

          await this.eventsService.recordRaw(
            session.providerType,
            EVENT_TYPES.MESSAGE_SENT,
            {
              messageId: message.id,
              externalMessageId: result.externalMessageId,
            },
            dto.sessionId,
          );

          // Dispatch webhook event
          void this.webhookService.dispatch("message.sent", {
            messageId: message.id,
            sessionId: dto.sessionId,
            to: dto.to,
            content: dto.message,
            status: "sent",
          });

          return message;
        }

        lastError = result.error ?? "Unknown provider error";
        this.logger.warn(
          `Send attempt ${attempt} failed: ${lastError}`,
          "MessagesService",
        );
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : "Unknown error";
        this.logger.error(
          `Send attempt ${attempt} threw: ${lastError}`,
          undefined,
          "MessagesService",
        );
      }

      if (attempt < this.retryAttempts) {
        await this.sleep(this.retryDelayMs);
      }
    }

    // 6. All retries exhausted
    message =
      (await this.messageRepo.update(message.id, {
        status: MESSAGE_STATUS.FAILED,
      })) ?? message;

    await this.eventsService.recordRaw(
      session.providerType,
      EVENT_TYPES.SEND_ERROR,
      { messageId: message.id, error: lastError },
      dto.sessionId,
    );

    throw new BadRequestException(
      `Failed to send message after ${this.retryAttempts} attempts: ${lastError}`,
    );
  }

  async findAll(): Promise<Message[]> {
    return this.messageRepo.findAll();
  }

  async findFiltered(filters: {
    userId?: string;
    sessionId?: string;
    sessionIds?: string[];
    status?: string;
    direction?: string;
    from?: string;
    to?: string;
    search?: string;
    limit?: number;
  }): Promise<Message[]> {
    let allowedSessionIds = filters.sessionIds;
    if (filters.userId && !allowedSessionIds) {
      const userSessions = await this.sessionRepo.findAllByUserId(filters.userId);
      allowedSessionIds = userSessions.map((s) => s.id);
    }

    let messages = await this.messageRepo.findAll();
    if (allowedSessionIds) {
      messages = messages.filter((m) => allowedSessionIds!.includes(m.sessionId));
    }
    if (filters.sessionId)
      messages = messages.filter((m) => m.sessionId === filters.sessionId);
    if (filters.status)
      messages = messages.filter((m) => m.status === filters.status);
    if (filters.direction)
      messages = messages.filter((m) => m.direction === filters.direction);
    if (filters.from)
      messages = messages.filter((m) => m.from.includes(filters.from!));
    if (filters.to)
      messages = messages.filter((m) => m.to.includes(filters.to!));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      messages = messages.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.from.includes(q) ||
          m.to.includes(q),
      );
    }
    return messages.slice(-(filters.limit ?? 100)).reverse();
  }

  async findById(id: string, userId?: string): Promise<Message> {
    const msg = await this.messageRepo.findById(id);
    if (!msg) throw new NotFoundException(`Message ${id} not found`);
    if (userId) {
      const session = await this.sessionRepo.findById(msg.sessionId);
      if (session && session.userId && session.userId !== userId) {
        throw new NotFoundException(`Message ${id} not found`);
      }
    }
    return msg;
  }

  /**
   * Called by webhook handlers when an inbound message arrives.
   * Saves the message, dispatches webhook event, and triggers auto-reply.
   */
  async handleInbound(params: {
    sessionId: string;
    from: string;
    to: string;
    content: string;
    externalMessageId?: string;
    rawPayload?: Record<string, unknown>;
  }): Promise<Message> {
    const now = new Date().toISOString();
    const message = await this.messageRepo.save({
      id: uuidv4(),
      sessionId: params.sessionId,
      externalMessageId: params.externalMessageId,
      direction: "inbound",
      from: params.from,
      to: params.to,
      type: "text",
      content: params.content,
      status: "received",
      rawPayload: params.rawPayload,
      createdAt: now,
      updatedAt: now,
    });

    // Dispatch webhook event (fire-and-forget)
    void this.webhookService.dispatch("message.received", {
      messageId: message.id,
      sessionId: params.sessionId,
      from: params.from,
      content: params.content,
    });

    // Check auto-reply rules
    const replyContent = await this.autoReplyService.match(
      params.sessionId,
      params.content,
    );
    if (replyContent) {
      void this.send({
        sessionId: params.sessionId,
        to: params.from,
        message: replyContent,
      });
    }

    return message;
  }

  async react(
    messageId: string,
    emoji: string,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const msg = await this.messageRepo.findById(messageId);
    if (!msg) throw new NotFoundException(`Message ${messageId} not found`);

    const session = await this.sessionRepo.findById(msg.sessionId);
    if (!session) throw new NotFoundException(`Session not found`);
    if (userId && session.userId && session.userId !== userId) {
      throw new BadRequestException("Unauthorized access to this session");
    }

    const provider = this.routingService.getProvider(session.providerType);
    if (provider.sendReaction) {
      const recipient = msg.direction === "inbound" ? msg.from : msg.to;
      const success = await provider.sendReaction(
        msg.sessionId,
        recipient,
        msg.id,
        emoji,
      );
      return { success };
    }
    return { success: false };
  }

  async unsend(
    messageId: string,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const msg = await this.messageRepo.findById(messageId);
    if (!msg) throw new NotFoundException(`Message ${messageId} not found`);

    const session = await this.sessionRepo.findById(msg.sessionId);
    if (!session) throw new NotFoundException(`Session not found`);
    if (userId && session.userId && session.userId !== userId) {
      throw new BadRequestException("Unauthorized access to this session");
    }

    const provider = this.routingService.getProvider(session.providerType);
    if (provider.deleteMessage) {
      const recipient = msg.direction === "inbound" ? msg.from : msg.to;
      const success = await provider.deleteMessage(
        msg.sessionId,
        recipient,
        msg.id,
      );
      return { success };
    }
    return { success: false };
  }

  async markConversationAsRead(
    sessionId: string,
    jid: string,
    userId?: string,
  ): Promise<{ success: boolean; count: number }> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new NotFoundException(`Session not found`);
    if (userId && session.userId && session.userId !== userId) {
      throw new BadRequestException("Unauthorized access to this session");
    }

    const allMessages = await this.messageRepo.findBySessionId(sessionId);
    const cleanNumber = jid.replace(/\D/g, "");
    const unreadInbound = allMessages.filter(
      (m) =>
        m.direction === "inbound" &&
        m.status !== "read" &&
        (m.from.includes(cleanNumber) || m.from === jid),
    );

    if (unreadInbound.length === 0) {
      return { success: true, count: 0 };
    }

    const provider = this.routingService.getProvider(session.providerType);
    if (provider.markAsRead) {
      await provider.markAsRead(
        sessionId,
        jid,
        unreadInbound.map((m) => m.id),
      );
    } else {
      for (const m of unreadInbound) {
        await this.messageRepo.update(m.id, { status: "read" });
      }
    }

    return { success: true, count: unreadInbound.length };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
