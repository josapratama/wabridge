import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, desc } from "drizzle-orm";
import {
  IpWhitelistRepository,
  SessionHealthRepository,
  TeamMemberRepository,
} from "../interfaces";
import {
  IpWhitelist,
  SessionHealthLog,
  TeamMember,
} from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleIpWhitelistRepository implements IpWhitelistRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findByApiKeyId(apiKeyId: string): Promise<IpWhitelist[]> {
    const results = await this.db
      .select()
      .from(schema.ipWhitelists)
      .where(eq(schema.ipWhitelists.apiKeyId, apiKeyId));

    return results.map((r) => ({
      id: r.id,
      apiKeyId: r.apiKeyId,
      cidr: r.cidr,
      label: r.label ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async save(entity: IpWhitelist): Promise<IpWhitelist> {
    const results = await this.db
      .insert(schema.ipWhitelists)
      .values({
        id: entity.id,
        apiKeyId: entity.apiKeyId,
        cidr: entity.cidr,
        label: entity.label ?? null,
      })
      .returning();

    const r = results[0];
    return {
      id: r.id,
      apiKeyId: r.apiKeyId,
      cidr: r.cidr,
      label: r.label ?? undefined,
      createdAt: r.createdAt.toISOString(),
    };
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(schema.ipWhitelists)
      .where(eq(schema.ipWhitelists.id, id));
  }
}

@Injectable()
export class DrizzleSessionHealthRepository implements SessionHealthRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async save(entity: SessionHealthLog): Promise<SessionHealthLog> {
    const results = await this.db
      .insert(schema.sessionHealthLogs)
      .values({
        id: entity.id,
        sessionId: entity.sessionId,
        status: entity.status,
        latencyMs: entity.latencyMs ?? null,
        messagesSentToday: entity.messagesSentToday,
        messagesReceivedToday: entity.messagesReceivedToday,
      })
      .returning();

    const r = results[0];
    return {
      id: r.id,
      sessionId: r.sessionId,
      status: r.status as SessionHealthLog["status"],
      latencyMs: r.latencyMs ?? undefined,
      messagesSentToday: r.messagesSentToday,
      messagesReceivedToday: r.messagesReceivedToday,
      checkedAt: r.checkedAt.toISOString(),
    };
  }

  async findLatestBySessionId(
    sessionId: string,
  ): Promise<SessionHealthLog | null> {
    const results = await this.db
      .select()
      .from(schema.sessionHealthLogs)
      .where(eq(schema.sessionHealthLogs.sessionId, sessionId))
      .orderBy(desc(schema.sessionHealthLogs.checkedAt))
      .limit(1);

    if (results.length === 0) return null;
    const r = results[0];
    return {
      id: r.id,
      sessionId: r.sessionId,
      status: r.status as SessionHealthLog["status"],
      latencyMs: r.latencyMs ?? undefined,
      messagesSentToday: r.messagesSentToday,
      messagesReceivedToday: r.messagesReceivedToday,
      checkedAt: r.checkedAt.toISOString(),
    };
  }

  async findAllLatest(): Promise<SessionHealthLog[]> {
    const results = await this.db
      .select()
      .from(schema.sessionHealthLogs)
      .orderBy(desc(schema.sessionHealthLogs.checkedAt));

    // Return the latest log per session
    const seen = new Set<string>();
    const latest: SessionHealthLog[] = [];
    for (const r of results) {
      if (!seen.has(r.sessionId)) {
        seen.add(r.sessionId);
        latest.push({
          id: r.id,
          sessionId: r.sessionId,
          status: r.status as SessionHealthLog["status"],
          latencyMs: r.latencyMs ?? undefined,
          messagesSentToday: r.messagesSentToday,
          messagesReceivedToday: r.messagesReceivedToday,
          checkedAt: r.checkedAt.toISOString(),
        });
      }
    }
    return latest;
  }
}

@Injectable()
export class DrizzleTeamMemberRepository implements TeamMemberRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findByOwnerId(ownerId: string): Promise<TeamMember[]> {
    const results = await this.db
      .select({
        member: schema.teamMembers,
        user: schema.users,
      })
      .from(schema.teamMembers)
      .leftJoin(schema.users, eq(schema.teamMembers.memberId, schema.users.id))
      .where(eq(schema.teamMembers.ownerId, ownerId));

    return results.map(({ member, user }) => ({
      id: member.id,
      ownerId: member.ownerId,
      memberId: member.memberId,
      role: member.role as TeamMember["role"],
      invitedAt: member.invitedAt.toISOString(),
      acceptedAt: member.acceptedAt?.toISOString(),
      memberEmail: user?.email,
      memberName: user?.name ?? undefined,
    }));
  }

  async save(entity: TeamMember): Promise<TeamMember> {
    const results = await this.db
      .insert(schema.teamMembers)
      .values({
        id: entity.id,
        ownerId: entity.ownerId,
        memberId: entity.memberId,
        role: entity.role,
        acceptedAt: entity.acceptedAt ? new Date(entity.acceptedAt) : null,
      })
      .returning();

    const r = results[0];
    return {
      id: r.id,
      ownerId: r.ownerId,
      memberId: r.memberId,
      role: r.role as TeamMember["role"],
      invitedAt: r.invitedAt.toISOString(),
      acceptedAt: r.acceptedAt?.toISOString(),
      memberEmail: entity.memberEmail,
      memberName: entity.memberName,
    };
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(schema.teamMembers)
      .where(eq(schema.teamMembers.id, id));
  }

  async updateRole(id: string, role: string): Promise<void> {
    await this.db
      .update(schema.teamMembers)
      .set({ role })
      .where(eq(schema.teamMembers.id, id));
  }
}
