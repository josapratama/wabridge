import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  TeamMemberRepository,
  UserRepository,
} from "../../repositories/interfaces";
import { TeamMember } from "../../common/types";

@Injectable()
export class TeamService {
  constructor(
    @Inject(TeamMemberRepository)
    private readonly teamRepo: TeamMemberRepository,
    @Inject(UserRepository) private readonly userRepo: UserRepository,
  ) {}

  async invite(
    ownerId: string,
    email: string,
    role: TeamMember["role"],
  ): Promise<TeamMember> {
    const member = await this.userRepo.findByEmail(email);
    if (!member)
      throw new NotFoundException(`User with email ${email} not found`);
    const existing = await this.teamRepo.findByOwnerId(ownerId);
    if (existing.some((m) => m.memberId === member.id))
      throw new ConflictException("User already in team");
    return this.teamRepo.save({
      id: uuidv4(),
      ownerId,
      memberId: member.id,
      role,
      invitedAt: new Date().toISOString(),
    });
  }

  async list(ownerId: string): Promise<TeamMember[]> {
    return this.teamRepo.findByOwnerId(ownerId);
  }

  async updateRole(id: string, role: TeamMember["role"]): Promise<void> {
    await this.teamRepo.updateRole(id, role);
  }

  async remove(id: string): Promise<void> {
    await this.teamRepo.delete(id);
  }
}
