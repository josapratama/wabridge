import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Optional,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  BroadcastJobRepository,
  ContactRepository,
} from "../../repositories/interfaces";
import { BroadcastJob } from "../../common/types";
import { MessagesService } from "../messages/messages.service";
import { AppLogger } from "../../common/logger/app.logger";

function parseSpintax(text: string): string {
  const spintaxRegex = /\{([^{}]+)\}/g;
  let result = text;
  while (spintaxRegex.test(result)) {
    result = result.replace(spintaxRegex, (_, choices) => {
      const options = choices.split("|");
      return options[Math.floor(Math.random() * options.length)].trim();
    });
  }
  return result;
}

@Injectable()
export class BroadcastService {
  private runningJobs = new Set<string>();

  constructor(
    @Inject(BroadcastJobRepository)
    private readonly repo: BroadcastJobRepository,
    private readonly messagesService: MessagesService,
    private readonly logger: AppLogger,
    @Optional()
    @Inject(ContactRepository)
    private readonly contactRepo?: ContactRepository,
  ) {}

  async create(
    userId: string,
    dto: {
      name: string;
      sessionId: string;
      content: string;
      recipients: string[];
      delayMs?: number;
    },
  ): Promise<BroadcastJob> {
    if (dto.recipients.length === 0)
      throw new BadRequestException("recipients cannot be empty");
    if (dto.recipients.length > 1000)
      throw new BadRequestException("max 1000 recipients per broadcast");
    return this.repo.save({
      id: uuidv4(),
      userId,
      sessionId: dto.sessionId,
      name: dto.name,
      content: dto.content,
      recipients: dto.recipients,
      delayMs: dto.delayMs ?? 2500,
      status: "pending",
      totalCount: dto.recipients.length,
      sentCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
    });
  }

  async list(userId: string): Promise<BroadcastJob[]> {
    return this.repo.findAllByUserId(userId);
  }

  async start(id: string, userId: string): Promise<BroadcastJob> {
    const job = await this.repo.findById(id);
    if (!job) throw new NotFoundException("Broadcast job not found");
    if (job.userId !== userId) throw new ForbiddenException();
    if (this.runningJobs.has(id))
      throw new BadRequestException("Job is already running");

    const updated = await this.repo.update(id, {
      status: "running",
      startedAt: new Date().toISOString(),
    });
    void this.runJob(updated!);
    return updated!;
  }

  async cancel(id: string, userId: string): Promise<BroadcastJob> {
    const job = await this.repo.findById(id);
    if (!job) throw new NotFoundException("Broadcast job not found");
    if (job.userId !== userId) throw new ForbiddenException();
    this.runningJobs.delete(id);
    const updated = await this.repo.update(id, { status: "cancelled" });
    return updated!;
  }

  private async runJob(job: BroadcastJob): Promise<void> {
    this.runningJobs.add(job.id);
    let sentCount = 0;
    let failedCount = 0;

    this.logger.log(
      `Starting broadcast ${job.id} to ${job.recipients.length} recipients with anti-ban jitter`,
      "BroadcastService",
    );

    for (const phone of job.recipients) {
      if (!this.runningJobs.has(job.id)) break; // cancelled

      // Lookup contact name for dynamic variables if available
      let contactName: string | undefined = undefined;
      if (this.contactRepo) {
        try {
          const cleanPhone = phone.replace(/\D/g, "");
          const c = await this.contactRepo.findByPhone(job.userId, cleanPhone);
          if (c) contactName = c.name;
        } catch {
          // ignore
        }
      }

      // Spintax & variable replacement
      let personalizedContent = parseSpintax(job.content);
      personalizedContent = personalizedContent
        .replace(/\{\{\s*name\s*\}\}/gi, contactName || "Kak")
        .replace(/\{\{\s*phone\s*\}\}/gi, phone)
        .replace(/\{\{\s*date\s*\}\}/gi, new Date().toLocaleDateString("id-ID"));

      try {
        await this.messagesService.send({
          sessionId: job.sessionId,
          to: phone,
          message: personalizedContent,
        });
        sentCount++;
      } catch (err) {
        failedCount++;
        this.logger.warn(
          `Broadcast ${job.id}: failed to send to ${phone}: ${err}`,
          "BroadcastService",
        );
      }

      await this.repo.update(job.id, { sentCount, failedCount });

      // Anti-ban randomized jitter delay
      const baseDelay = Math.max(job.delayMs || 2500, 1500);
      const jitterMs = Math.floor(baseDelay * (0.8 + Math.random() * 0.6));
      await new Promise((r) => setTimeout(r, jitterMs));
    }

    const wasRunning = this.runningJobs.has(job.id);
    this.runningJobs.delete(job.id);

    const finalStatus = !wasRunning
      ? "cancelled"
      : failedCount === job.recipients.length
        ? "failed"
        : "completed";

    await this.repo.update(job.id, {
      status: finalStatus,
      sentCount,
      failedCount,
      completedAt: new Date().toISOString(),
    });

    this.logger.log(
      `Broadcast ${job.id} ${finalStatus}: ${sentCount} sent, ${failedCount} failed`,
      "BroadcastService",
    );
  }
}
