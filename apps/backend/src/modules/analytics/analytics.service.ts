import { Injectable, Inject } from "@nestjs/common";
import {
  MessageRepository,
  UsageRepository,
  SessionRepository,
} from "../../repositories/interfaces";
import { AnalyticsSummary } from "../../common/types";

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(MessageRepository) private readonly messageRepo: MessageRepository,
    @Inject(UsageRepository) private readonly usageRepo: UsageRepository,
    @Inject(SessionRepository) private readonly sessionRepo: SessionRepository,
  ) {}

  async getSummary(userId: string): Promise<AnalyticsSummary> {
    const userSessions = await this.sessionRepo.findAllByUserId(userId);
    const sessionIds = userSessions.map((s) => s.id);

    let messages = await this.messageRepo.findAll();
    messages = messages.filter((m) => sessionIds.includes(m.sessionId));

    const totalSent = messages.filter((m) => m.direction === "outbound").length;
    const totalReceived = messages.filter(
      (m) => m.direction === "inbound",
    ).length;
    const failed = messages.filter((m) => m.status === "failed").length;
    const successRate =
      totalSent > 0
        ? Math.round(((totalSent - failed) / totalSent) * 100)
        : 100;

    // Daily stats for last 7 days
    const dailyMap = new Map<
      string,
      { sent: number; received: number; failed: number }
    >();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailyMap.set(d.toISOString().split("T")[0], {
        sent: 0,
        received: 0,
        failed: 0,
      });
    }

    for (const msg of messages) {
      const date = msg.createdAt.split("T")[0];
      if (!dailyMap.has(date)) continue;
      const entry = dailyMap.get(date)!;
      if (msg.direction === "outbound") {
        entry.sent++;
        if (msg.status === "failed") entry.failed++;
      } else {
        entry.received++;
      }
    }

    const dailyStats = [...dailyMap.entries()].map(([date, v]) => ({
      date,
      ...v,
    }));

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const msg of messages) {
      statusBreakdown[msg.status] = (statusBreakdown[msg.status] ?? 0) + 1;
    }

    return {
      totalSent,
      totalReceived,
      successRate,
      dailyStats,
      statusBreakdown,
    };
  }

  async getUsage(userId: string) {
    const month = new Date().toISOString().slice(0, 7);
    const record = await this.usageRepo.findByUserAndMonth(userId, month);
    return (
      record ?? {
        messagesSent: 0,
        messagesReceived: 0,
        quotaLimit: 1000,
        month,
      }
    );
  }
}
