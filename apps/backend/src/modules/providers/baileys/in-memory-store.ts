import type { BaileysEventEmitter, proto } from "@whiskeysockets/baileys";
import * as fs from "fs";
import type { Logger } from "pino";

export interface InMemoryStoreOptions {
  logger?: Logger;
}

export class InMemoryStore {
  public messages: Map<string, Map<string, proto.IWebMessageInfo>> = new Map();
  private logger?: Logger;

  constructor(options?: InMemoryStoreOptions) {
    this.logger = options?.logger;
  }

  async loadMessage(
    jid: string,
    id: string,
  ): Promise<proto.IWebMessageInfo | undefined> {
    const chat = this.messages.get(jid);
    return chat?.get(id);
  }

  bind(ev: BaileysEventEmitter): void {
    ev.on("messages.upsert", ({ messages: msgs }) => {
      for (const msg of msgs) {
        const jid = msg.key?.remoteJid;
        const id = msg.key?.id;
        if (!jid || !id) continue;

        let chat = this.messages.get(jid);
        if (!chat) {
          chat = new Map();
          this.messages.set(jid, chat);
        }
        chat.set(id, msg);

        // Keep last 100 messages per chat to prevent memory bloat
        if (chat.size > 100) {
          const oldestKey = chat.keys().next().value;
          if (oldestKey) chat.delete(oldestKey);
        }
      }
    });

    ev.on("messages.update", (updates) => {
      for (const update of updates) {
        const jid = update.key?.remoteJid;
        const id = update.key?.id;
        if (!jid || !id) continue;

        const chat = this.messages.get(jid);
        const existing = chat?.get(id);
        if (existing && update.update) {
          Object.assign(existing, update.update);
        }
      }
    });
  }

  writeToFile(filePath: string): void {
    try {
      const data: Record<string, Record<string, unknown>> = {};
      for (const [jid, chat] of this.messages.entries()) {
        data[jid] = {};
        for (const [id, msg] of chat.entries()) {
          data[jid][id] = msg;
        }
      }
      fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");
    } catch (err) {
      this.logger?.warn({ err }, "Failed to write Baileys store to file");
    }
  }

  readFromFile(filePath: string): void {
    try {
      if (!fs.existsSync(filePath)) return;
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw) as Record<string, Record<string, proto.IWebMessageInfo>>;
      this.messages.clear();
      for (const [jid, chat] of Object.entries(data)) {
        const map = new Map<string, proto.IWebMessageInfo>();
        for (const [id, msg] of Object.entries(chat)) {
          map.set(id, msg);
        }
        this.messages.set(jid, map);
      }
    } catch (err) {
      this.logger?.warn({ err }, "Failed to read Baileys store from file");
    }
  }
}

export function makeInMemoryStore(options?: InMemoryStoreOptions): InMemoryStore {
  return new InMemoryStore(options);
}
