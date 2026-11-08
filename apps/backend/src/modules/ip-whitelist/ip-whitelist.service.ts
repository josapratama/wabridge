import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { IpWhitelistRepository } from "../../repositories/interfaces";
import { IpWhitelist } from "../../common/types";

@Injectable()
export class IpWhitelistService {
  constructor(
    @Inject(IpWhitelistRepository)
    private readonly repo: IpWhitelistRepository,
  ) {}

  async list(apiKeyId: string): Promise<IpWhitelist[]> {
    return this.repo.findByApiKeyId(apiKeyId);
  }

  async add(
    apiKeyId: string,
    cidr: string,
    label?: string,
  ): Promise<IpWhitelist> {
    return this.repo.save({
      id: uuidv4(),
      apiKeyId,
      cidr,
      label,
      createdAt: new Date().toISOString(),
    });
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  /**
   * Returns true if no whitelist rules exist (open) or if IP matches any rule.
   */
  async isAllowed(apiKeyId: string, ip: string): Promise<boolean> {
    const rules = await this.repo.findByApiKeyId(apiKeyId);
    if (rules.length === 0) return true; // no restrictions
    return rules.some((r) => this.matchesCidr(ip, r.cidr));
  }

  private matchesCidr(ip: string, cidr: string): boolean {
    try {
      if (!cidr.includes("/")) return ip === cidr;
      const [range, bits] = cidr.split("/");
      const mask = ~(0xffffffff >>> parseInt(bits));
      return (this.ipToInt(ip) & mask) === (this.ipToInt(range) & mask);
    } catch {
      return false;
    }
  }

  private ipToInt(ip: string): number {
    return (
      ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0
    );
  }
}
