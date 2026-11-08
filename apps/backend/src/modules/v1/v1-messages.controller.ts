import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiKeyGuard } from "../api-keys/guards/api-key.guard";
import { MessagesService } from "../messages/messages.service";
import { BroadcastService } from "../broadcast/broadcast.service";
import { SessionsService } from "../sessions/sessions.service";
import { V1SendMessageDto, V1BroadcastDto } from "./dto/v1-send-message.dto";

@Controller("v1")
@UseGuards(ApiKeyGuard)
export class V1MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly broadcastService: BroadcastService,
    private readonly sessionsService: SessionsService,
  ) {}

  /**
   * POST /v1/messages/send or POST /v1/messages
   * Send a single message (text, image, document, audio, video, location).
   * Supports sandbox mode.
   */
  @Post(["messages/send", "messages"])
  @HttpCode(HttpStatus.OK)
  async send(@Body() dto: V1SendMessageDto, @Request() req: any) {
    // Sandbox mode — return fake success without sending
    if (dto.sandbox) {
      return {
        message_id: `sandbox_${Date.now()}`,
        session_id: dto.session_id,
        to: dto.to,
        status: "sandbox",
        sent_at: new Date().toISOString(),
        sandbox: true,
      };
    }

    const message = await this.messagesService.send({
      sessionId: dto.session_id,
      to: dto.to,
      message: dto.message,
      type: dto.type as any,
      mediaUrl: dto.media_url,
      mediaCaption: dto.caption,
      mediaMimeType: dto.media_mime_type,
      latitude: dto.latitude,
      longitude: dto.longitude,
      locationName: dto.location_name,
    });

    return {
      message_id: message.id,
      session_id: message.sessionId,
      to: message.to,
      status: message.status,
      type: message.type,
      media_url: message.mediaUrl,
      sent_at: message.createdAt,
    };
  }

  /**
   * POST /v1/messages/broadcast or POST /v1/broadcast
   * Send to multiple recipients with delay.
   */
  @Post(["messages/broadcast", "broadcast"])
  @HttpCode(HttpStatus.OK)
  async broadcast(@Body() dto: V1BroadcastDto, @Request() req: any) {
    if (dto.sandbox) {
      return {
        job_id: `sandbox_${Date.now()}`,
        total: dto.recipients.length,
        status: "sandbox",
        sandbox: true,
      };
    }

    const job = await this.broadcastService.create(req.userId, {
      name: `API Broadcast ${new Date().toISOString()}`,
      sessionId: dto.session_id,
      content: dto.message,
      recipients: dto.recipients,
      delayMs: dto.delay_ms,
    });

    // Auto-start
    await this.broadcastService.start(job.id, req.userId);

    return {
      job_id: job.id,
      total: job.totalCount,
      status: job.status,
    };
  }

  /**
   * GET /v1/sessions
   * List available WhatsApp sessions for developers.
   */
  @Get("sessions")
  async listSessions() {
    const sessions = await this.sessionsService.findAll();
    return sessions.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      provider_type: s.providerType,
      created_at: s.createdAt,
    }));
  }

  /**
   * GET /v1/sessions/:id
   * Get single session details by ID.
   */
  @Get("sessions/:id")
  async getSession(@Param("id") id: string) {
    const s = await this.sessionsService.findById(id);
    return {
      id: s.id,
      name: s.name,
      status: s.status,
      provider_type: s.providerType,
      created_at: s.createdAt,
    };
  }

  /**
   * GET /v1/messages
   * List messages with optional filters.
   */
  @Get("messages")
  async list(
    @Query("session_id") sessionId?: string,
    @Query("status") status?: string,
    @Query("direction") direction?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limit?: string,
  ) {
    const messages = await this.messagesService.findAll();
    let filtered = messages;
    if (sessionId) filtered = filtered.filter((m) => m.sessionId === sessionId);
    if (status) filtered = filtered.filter((m) => m.status === status);
    if (direction) filtered = filtered.filter((m) => m.direction === direction);
    if (from) filtered = filtered.filter((m) => m.from.includes(from));
    if (to) filtered = filtered.filter((m) => m.to.includes(to));
    const limitN = parseInt(limit ?? "50", 10);
    return filtered.slice(-limitN).reverse();
  }
}
