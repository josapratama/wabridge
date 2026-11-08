import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Optional,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  ContactRepository,
  MessageRepository,
} from "../../repositories/interfaces";
import { Contact } from "../../common/types";
import { BaileysWhatsAppProvider } from "../providers/baileys/baileys.provider";

@Injectable()
export class ContactsService {
  constructor(
    @Inject(ContactRepository) private readonly repo: ContactRepository,
    @Optional()
    @Inject(MessageRepository)
    private readonly messageRepo?: MessageRepository,
    @Optional()
    private readonly baileysProvider?: BaileysWhatsAppProvider,
  ) {}

  async create(
    userId: string,
    dto: { name: string; phone: string; tags?: string[]; notes?: string },
  ): Promise<Contact> {
    const cleanPhone = dto.phone.replace(/\D/g, "");
    const existing = await this.repo.findByPhone(userId, cleanPhone);
    if (existing)
      throw new ConflictException(
        `Contact with phone ${dto.phone} already exists`,
      );
    return this.repo.save({
      id: uuidv4(),
      userId,
      name: dto.name,
      phone: cleanPhone,
      tags: dto.tags ?? [],
      notes: dto.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async list(userId: string): Promise<Contact[]> {
    return this.repo.findAllByUserId(userId);
  }

  async update(
    id: string,
    userId: string,
    dto: Partial<{
      name: string;
      phone: string;
      tags: string[];
      notes: string;
    }>,
  ): Promise<Contact> {
    const contact = await this.repo.findById(id);
    if (!contact) throw new NotFoundException("Contact not found");
    if (contact.userId !== userId) throw new ForbiddenException();
    const updated = await this.repo.update(id, dto);
    return updated!;
  }

  async delete(id: string, userId: string): Promise<void> {
    const contact = await this.repo.findById(id);
    if (!contact) throw new NotFoundException("Contact not found");
    if (contact.userId !== userId) throw new ForbiddenException();
    await this.repo.delete(id);
  }

  async getByTag(userId: string, tag: string): Promise<Contact[]> {
    const all = await this.repo.findAllByUserId(userId);
    return all.filter((c) => c.tags.includes(tag));
  }

  async syncFromWhatsApp(
    userId: string,
    sessionId?: string,
  ): Promise<{ synced: number; total: number }> {
    let rawContacts: Array<{ phone: string; name: string; jid: string }> = [];

    if (this.baileysProvider) {
      try {
        rawContacts = await this.baileysProvider.syncContacts(sessionId);
      } catch (err) {
        // continue
      }
    }

    if (this.messageRepo) {
      try {
        const messages = await this.messageRepo.findAll();
        for (const msg of messages) {
          if (
            msg.direction === "inbound" &&
            msg.from &&
            !msg.from.endsWith("@g.us")
          ) {
            const phone = msg.from.split("@")[0].split(":")[0].replace(/\D/g, "");
            if (phone.length >= 7 && !rawContacts.some((c) => c.phone === phone)) {
              rawContacts.push({
                phone,
                name: `WA (+${phone})`,
                jid: msg.from,
              });
            }
          }
        }
      } catch (err) {
        // continue
      }
    }

    let synced = 0;
    for (const c of rawContacts) {
      const cleanPhone = c.phone.replace(/\D/g, "");
      if (cleanPhone.length < 7) continue;
      const existing = await this.repo.findByPhone(userId, cleanPhone);
      if (!existing) {
        await this.repo.save({
          id: uuidv4(),
          userId,
          name: c.name || `WA Contact ${cleanPhone.slice(-4)}`,
          phone: cleanPhone,
          tags: ["whatsapp-sync"],
          notes: "Auto-synced from WhatsApp",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        synced++;
      }
    }

    const all = await this.repo.findAllByUserId(userId);
    return { synced, total: all.length };
  }
}
