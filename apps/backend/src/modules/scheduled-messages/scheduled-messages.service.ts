import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { ScheduledMessageRepository } from "../../repositories/interfaces";
import { ScheduledMessage } from "../../common/types";
import { MessagesService } from "../messages/messages.service";
import { CreateScheduledMessageDto } from "./dto/scheduled-message.dto";
import { AppLogger } from "../../common/logger/app.logger";

@Injectable()
export class ScheduledMessagesService {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(ScheduledMessageRepository)
    private readonly repo: ScheduledMessageRepository,
    private readonly messagesService: MessagesService,
    private readonly logger: AppLogger,
  ) {}

  onModuleInit() {
    // Poll every 30 seconds for due messages
    this.timer = setInterval(() => void this.processDue(), 30_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async create(
    userId: string,
    dto: CreateScheduledMessageDto,
  ): Promise<ScheduledMessage> {
    if (new Date(dto.scheduledAt) <= new Date()) {
      throw new BadRequestException("scheduledAt must be in the future");
    }
    return this.repo.save({
      id: uuidv4(),
      userId,
      sessionId: dto.sessionId,
      to: dto.to,
      type: "text",
      content: dto.content,
      mediaUrl: dto.mediaUrl,
      scheduledAt: dto.scheduledAt,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }

  async list(userId: string): Promise<ScheduledMessage[]> {
    return this.repo.findAllByUserId(userId);
  }

  async cancel(id: string, userId: string): Promise<ScheduledMessage> {
    const msg = await this.repo.findById(id);
    if (!msg) throw new NotFoundException("Scheduled message not found");
    if (msg.userId !== userId) throw new ForbiddenException();
    if (msg.status !== "pending")
      throw new BadRequestException("Only pending messages can be cancelled");
    const updated = await this.repo.update(id, { status: "cancelled" });
    return updated!;
  }

  async processDue(): Promise<void> {
    const due = await this.repo.findDuePending();
    if (due.length === 0) return;

    this.logger.log(
      `Processing ${due.length} scheduled messages`,
      "ScheduledMessages",
    );

    for (const scheduled of due) {
      try {
        const message = await this.messagesService.send({
          sessionId: scheduled.sessionId,
          to: scheduled.to,
          message: scheduled.content,
        });
        await this.repo.update(scheduled.id, {
          status: "sent",
          messageId: message.id,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        await this.repo.update(scheduled.id, {
          status: "failed",
          errorMessage,
        });
        this.logger.error(
          `Scheduled message ${scheduled.id} failed: ${errorMessage}`,
          undefined,
          "ScheduledMessages",
        );
      }
    }
  }
}
