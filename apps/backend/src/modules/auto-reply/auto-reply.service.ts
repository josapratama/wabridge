import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { AutoReplyRuleRepository } from "../../repositories/interfaces";
import { AutoReplyRule } from "../../common/types";
import { CreateAutoReplyDto, UpdateAutoReplyDto } from "./dto/auto-reply.dto";
import { AppLogger } from "../../common/logger/app.logger";

@Injectable()
export class AutoReplyService {
  constructor(
    @Inject(AutoReplyRuleRepository)
    private readonly repo: AutoReplyRuleRepository,
    private readonly logger: AppLogger,
  ) {}

  async create(
    userId: string,
    dto: CreateAutoReplyDto,
  ): Promise<AutoReplyRule> {
    return this.repo.save({
      id: uuidv4(),
      userId,
      sessionId: dto.sessionId,
      name: dto.name,
      matchType: dto.matchType,
      matchValue: dto.matchValue,
      replyContent: dto.replyContent,
      isActive: true,
      priority: dto.priority ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async list(userId: string): Promise<AutoReplyRule[]> {
    return this.repo.findAllByUserId(userId);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateAutoReplyDto,
  ): Promise<AutoReplyRule> {
    const rule = await this.repo.findById(id);
    if (!rule) throw new NotFoundException("Rule not found");
    if (rule.userId !== userId) throw new ForbiddenException();
    const updated = await this.repo.update(id, dto);
    return updated!;
  }

  async delete(id: string, userId: string): Promise<void> {
    const rule = await this.repo.findById(id);
    if (!rule) throw new NotFoundException("Rule not found");
    if (rule.userId !== userId) throw new ForbiddenException();
    await this.repo.delete(id);
  }

  /**
   * Check if an inbound message matches any auto-reply rule.
   * Returns the reply content if matched, null otherwise.
   */
  async match(sessionId: string, inboundText: string): Promise<string | null> {
    const rules = await this.repo.findActiveForSession(sessionId);
    const text = inboundText.toLowerCase();

    for (const rule of rules) {
      const value = rule.matchValue.toLowerCase();
      let matched = false;

      switch (rule.matchType) {
        case "exact":
          matched = text === value;
          break;
        case "contains":
          matched = text.includes(value);
          break;
        case "starts_with":
          matched = text.startsWith(value);
          break;
        case "regex":
          try {
            matched = new RegExp(rule.matchValue, "i").test(inboundText);
          } catch {
            matched = false;
          }
          break;
      }

      if (matched) {
        this.logger.log(`Auto-reply rule "${rule.name}" matched`, "AutoReply");
        return rule.replyContent;
      }
    }

    return null;
  }
}
