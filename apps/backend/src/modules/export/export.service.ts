import { Injectable, Inject } from "@nestjs/common";
import {
  MessageRepository,
  ContactRepository,
  SessionRepository,
} from "../../repositories/interfaces";
import { Message, Contact } from "../../common/types";

interface ExportResult {
  data: string;
  filename: string;
  contentType: string;
}

@Injectable()
export class ExportService {
  constructor(
    @Inject(MessageRepository) private readonly messageRepo: MessageRepository,
    @Inject(ContactRepository) private readonly contactRepo: ContactRepository,
    @Inject(SessionRepository) private readonly sessionRepo: SessionRepository,
  ) {}

  async exportMessages(filters: {
    userId: string;
    format: "csv" | "json";
    sessionId?: string;
    status?: string;
    direction?: string;
  }): Promise<ExportResult> {
    const userSessions = await this.sessionRepo.findAllByUserId(filters.userId);
    const sessionIds = userSessions.map((s) => s.id);

    let messages = await this.messageRepo.findAll();
    messages = messages.filter((m) => sessionIds.includes(m.sessionId));
    if (filters.sessionId)
      messages = messages.filter((m) => m.sessionId === filters.sessionId);
    if (filters.status)
      messages = messages.filter((m) => m.status === filters.status);
    if (filters.direction)
      messages = messages.filter((m) => m.direction === filters.direction);

    const timestamp = new Date().toISOString().slice(0, 10);

    if (filters.format === "json") {
      return {
        data: JSON.stringify(messages, null, 2),
        filename: `messages_${timestamp}.json`,
        contentType: "application/json",
      };
    }

    const headers: (keyof Message)[] = [
      "id",
      "sessionId",
      "direction",
      "from",
      "to",
      "type",
      "content",
      "status",
      "createdAt",
    ];
    const rows = messages.map((m) =>
      headers.map((h) => this.escapeCsv(String(m[h] ?? ""))).join(","),
    );

    return {
      data: [headers.join(","), ...rows].join("\n"),
      filename: `messages_${timestamp}.csv`,
      contentType: "text/csv",
    };
  }

  async exportContacts(
    userId: string,
    format: "csv" | "json",
  ): Promise<ExportResult> {
    const contacts = await this.contactRepo.findAllByUserId(userId);
    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === "json") {
      return {
        data: JSON.stringify(contacts, null, 2),
        filename: `contacts_${timestamp}.json`,
        contentType: "application/json",
      };
    }

    const headers = ["id", "name", "phone", "tags", "notes", "createdAt"];
    const rows = contacts.map((c) =>
      [
        this.escapeCsv(c.id),
        this.escapeCsv(c.name),
        this.escapeCsv(c.phone),
        this.escapeCsv(c.tags.join(";")),
        this.escapeCsv(c.notes ?? ""),
        this.escapeCsv(c.createdAt),
      ].join(","),
    );

    return {
      data: [headers.join(","), ...rows].join("\n"),
      filename: `contacts_${timestamp}.csv`,
      contentType: "text/csv",
    };
  }

  private escapeCsv(val: string): string {
    const str = val.replace(/"/g, '""');
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str}"`
      : str;
  }
}
