import { Injectable, Inject, Optional } from "@nestjs/common";
import { AppLogger } from "../../../common/logger/app.logger";
import { MESSAGE_STATUS, PROVIDER_TYPES } from "../../../common/constants";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import type {
  ConnectAccountCommand,
  ProviderAccountResult,
  ProviderHealthResult,
  ProviderWebhookEvent,
  SendMessageResult,
  SendTextMessageCommand,
  VerifyWebhookQuery,
  VerifyWebhookResult,
  MessageStatus,
} from "../../../common/types";
import type { WhatsAppProvider } from "../whatsapp-provider.interface";
import { EventsService } from "../../events/events.service";
import {
  MessageRepository,
  SessionRepository,
  ProviderConfigRepository,
} from "../../../repositories/interfaces";
import { AutoReplyService } from "../../auto-reply/auto-reply.service";
import { WebhookOutboundService } from "../../webhook-outbound/webhook-outbound.service";
import { AiBotService } from "../../ai-bot/ai-bot.service";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
} from "@whiskeysockets/baileys";
import * as qrcode from "qrcode";
import pino from "pino";
import { makeInMemoryStore, type InMemoryStore } from "./in-memory-store";

export interface BaileysSessionInstance {
  configId: string;
  sessionId?: string;
  sock: ReturnType<typeof makeWASocket> | null;
  qrCodeData: string | null;
  pairingCode: string | null;
  phoneNumber: string | null;
  isConnecting: boolean;
  connectionReady: boolean;
  store: InMemoryStore | null;
}

@Injectable()
export class BaileysWhatsAppProvider implements WhatsAppProvider {
  // Multi-session state keyed by configId
  private sessions = new Map<string, BaileysSessionInstance>();
  private sessionToConfig = new Map<string, string>();
  private lastReplyTimeByJid = new Map<string, number>();
  private logger_pino = pino({ level: "info" });

  constructor(
    private readonly logger: AppLogger,
    private readonly eventsService: EventsService,
    @Inject(MessageRepository)
    private readonly messageRepo: MessageRepository,
    private readonly autoReplyService: AutoReplyService,
    private readonly webhookService: WebhookOutboundService,
    @Optional()
    private readonly aiBotService?: AiBotService,
    @Optional()
    @Inject(SessionRepository)
    private readonly sessionRepo?: SessionRepository,
    @Optional()
    @Inject(ProviderConfigRepository)
    private readonly configRepo?: ProviderConfigRepository,
  ) {}

  private getOrCreateSession(configId: string): BaileysSessionInstance {
    let inst = this.sessions.get(configId);
    if (!inst) {
      inst = {
        configId,
        sock: null,
        qrCodeData: null,
        pairingCode: null,
        phoneNumber: null,
        isConnecting: false,
        connectionReady: false,
        store: null,
      };
      this.sessions.set(configId, inst);
    }
    return inst;
  }

  private findSession(
    configId?: string,
    sessionId?: string,
  ): BaileysSessionInstance | null {
    if (configId && this.sessions.has(configId)) {
      return this.sessions.get(configId)!;
    }
    if (sessionId) {
      const cId = this.sessionToConfig.get(sessionId);
      if (cId && this.sessions.has(cId)) {
        return this.sessions.get(cId)!;
      }
      for (const inst of this.sessions.values()) {
        if (inst.sessionId === sessionId) return inst;
      }
    }
    // Fallback: return the first connected session or first available session
    for (const inst of this.sessions.values()) {
      if (inst.connectionReady && inst.sock) return inst;
    }
    if (this.sessions.size > 0) {
      return this.sessions.values().next().value ?? null;
    }
    return null;
  }

  private getAuthDir(configId: string): string {
    const baseDir =
      process.env.BAILEYS_AUTH_DIR ||
      (fs.existsSync("/app/baileys_auth_data")
        ? "/app/baileys_auth_data"
        : path.join(process.cwd(), "baileys_auth_data"));
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    return path.join(baseDir, `baileys_auth_${configId}`);
  }

  async connectAccount(
    input: ConnectAccountCommand,
  ): Promise<ProviderAccountResult> {
    const { config } = input;

    if (!config?.name) {
      return {
        success: false,
        message: "Baileys provider requires a valid configuration",
      };
    }

    const inst = this.getOrCreateSession(config.id);
    if (input.sessionId) {
      inst.sessionId = input.sessionId;
      this.sessionToConfig.set(input.sessionId, config.id);
    }

    if (inst.isConnecting) {
      return { success: true, message: "Connection already in progress" };
    }

    // Close existing socket for this specific session if any
    if (inst.sock) {
      try {
        inst.sock.end(undefined);
        inst.sock.ev.removeAllListeners("connection.update");
        inst.sock.ev.removeAllListeners("creds.update");
        inst.sock.ev.removeAllListeners("messages.upsert");
        inst.sock.ev.removeAllListeners("messages.update");
      } catch (e) {
        // ignore
      }
      inst.sock = null;
    }

    inst.isConnecting = true;
    inst.connectionReady = false;

    const authDir = this.getAuthDir(config.id);
    const storePath = path.join(authDir, "baileys_store.json");

    if (!inst.store) {
      inst.store = makeInMemoryStore({ logger: this.logger_pino });
      inst.store.readFromFile(storePath);
    }

    try {
      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      const { version, isLatest } = await fetchLatestBaileysVersion();
      this.logger.log(
        `[Session ${config.id}] Using Baileys v${version.join(".")} (latest: ${isLatest})`,
        "BaileysWhatsAppProvider",
      );

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: this.logger_pino,
        browser: Browsers.ubuntu("Chrome"),
        mobile: false,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 5000,
        getMessage: async (key) => {
          if (inst.store) {
            const msg = await inst.store.loadMessage(key.remoteJid!, key.id!);
            return msg?.message || undefined;
          }
          return undefined;
        },
      });

      inst.sock = sock;
      inst.store?.bind(sock.ev);

      sock.ev.on("creds.update", () => {
        void saveCreds();
        inst.store?.writeToFile(storePath);
      });

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        this.logger.log(
          `[Session ${config.id}] Connection update: ${JSON.stringify({ connection, hasQr: !!qr })}`,
          "BaileysWhatsAppProvider",
        );

        if (sock.user?.id) {
          this.logger.log(
            `[Session ${config.id}] Logged in as: ${sock.user.id}`,
            "BaileysWhatsAppProvider",
          );
        }

        if (qr) {
          inst.qrCodeData = await qrcode.toDataURL(qr);
          this.logger.log(
            `[Session ${config.id}] QR Code generated`,
            "BaileysWhatsAppProvider",
          );
        }

        if (connection === "close") {
          inst.isConnecting = false;
          inst.connectionReady = false;
          inst.qrCodeData = null;

          const statusCode = (lastDisconnect?.error as any)?.output
            ?.statusCode;

          this.logger.warn(
            `[Session ${config.id}] Connection closed. Status: ${statusCode}`,
            "BaileysWhatsAppProvider",
          );

          if (statusCode === DisconnectReason.loggedOut) {
            this.logger.warn(
              `[Session ${config.id}] Logged out. Clearing session files...`,
              "BaileysWhatsAppProvider",
            );
            this.clearSession(config.id);

            if (this.sessionRepo) {
              let sId = input.sessionId || inst.sessionId;
              if (!sId) {
                const sessions =
                  await this.sessionRepo.findByProviderConfigId(config.id);
                if (sessions.length > 0) sId = sessions[0].id;
              }
              if (sId) {
                void this.sessionRepo.update(sId, { status: "inactive" });
              }
            }
          } else if (statusCode === 401) {
            this.logger.warn(
              `[Session ${config.id}] 401 Unauthorized. Clearing and retrying...`,
              "BaileysWhatsAppProvider",
            );
            this.clearSession(config.id);
            setTimeout(() => {
              void this.connectAccount(input);
            }, 2000);
          } else if (statusCode === 408 || statusCode === DisconnectReason.timedOut) {
            this.logger.log(
              `[Session ${config.id}] QR scan timed out (408). Standby until user requests a new QR code.`,
              "BaileysWhatsAppProvider",
            );
            // Standby without infinite reconnection loops
          } else {
            this.logger.log(
              `[Session ${config.id}] Reconnecting in 10 seconds...`,
              "BaileysWhatsAppProvider",
            );
            setTimeout(() => {
              void this.connectAccount(input);
            }, 10000);
          }
        } else if (connection === "open") {
          inst.isConnecting = false;
          inst.connectionReady = true;
          inst.qrCodeData = null;
          inst.pairingCode = null;
          this.logger.log(
            `[Session ${config.id}] Baileys connection opened successfully`,
            "BaileysWhatsAppProvider",
          );

          if (this.sessionRepo) {
            let sId = input.sessionId || inst.sessionId;
            if (!sId) {
              const sessions =
                await this.sessionRepo.findByProviderConfigId(config.id);
              if (sessions.length > 0) sId = sessions[0].id;
            }
            if (sId) {
              inst.sessionId = sId;
              this.sessionToConfig.set(sId, config.id);
              const rawId = sock.user?.id || "";
              const phone = rawId.split(":")[0].replace(/\D/g, "");
              void this.sessionRepo.update(sId, {
                status: "active",
                metadata: {
                  phoneNumber: phone,
                  jid: rawId,
                  userName: sock.user?.name,
                  lastConnectedAt: new Date().toISOString(),
                },
              });
            }
          }
        }
      });

      // Register incoming message listeners
      this.setupEventHandlers(config.id, input.sessionId || inst.sessionId || "");

      return { success: true, message: "Baileys connection initiated" };
    } catch (error) {
      inst.isConnecting = false;
      this.logger.error(
        `[Session ${config.id}] Connection failed: ${error}`,
        undefined,
        "BaileysWhatsAppProvider",
      );
      return { success: false, message: `Connection failed: ${error}` };
    }
  }

  private setupEventHandlers(configId: string, initialSessionId: string) {
    const inst = this.sessions.get(configId);
    if (!inst?.sock) return;
    const sock = inst.sock;

    sock.ev.on("messages.upsert", async (m) => {
      if (m.type !== "notify") return;

      let effectiveSessionId = inst.sessionId || initialSessionId;
      if (!effectiveSessionId && this.sessionRepo) {
        const list = await this.sessionRepo.findByProviderConfigId(configId);
        if (list.length > 0) effectiveSessionId = list[0].id;
      }

      for (const msg of m.messages) {
        if (!msg.key.fromMe && msg.message) {
          let messageType: "text" | "image" | "audio" | "video" | "document" =
            "text";
          let content =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

          if (msg.message.imageMessage) {
            messageType = "image";
            content = msg.message.imageMessage.caption || "[Image]";
          } else if (msg.message.videoMessage) {
            messageType = "video";
            content = msg.message.videoMessage.caption || "[Video]";
          } else if (msg.message.audioMessage) {
            messageType = "audio";
            content = "[Voice Note / Audio]";
          } else if (msg.message.documentMessage) {
            messageType = "document";
            content = msg.message.documentMessage.fileName
              ? `[Document: ${msg.message.documentMessage.fileName}]`
              : "[Document]";
          }

          const from = msg.key.remoteJid || "";
          const to = sock.user?.id || "";

          // Auto-download media for inbound images, audio, documents, and videos
          let mediaUrl: string | undefined = undefined;
          let mediaMimeType: string | undefined = undefined;

          if (messageType !== "text") {
            try {
              const buffer = await downloadMediaMessage(
                msg,
                "buffer",
                {},
                {
                  logger: this.logger_pino,
                  reuploadRequest: sock.updateMediaMessage,
                },
              );
              if (buffer && Buffer.isBuffer(buffer)) {
                const uploadsDir = path.join(process.cwd(), "public", "uploads");
                if (!fs.existsSync(uploadsDir)) {
                  fs.mkdirSync(uploadsDir, { recursive: true });
                }
                const extMap: Record<string, string> = {
                  image: "jpg",
                  audio: "ogg",
                  video: "mp4",
                  document:
                    msg.message?.documentMessage?.fileName?.split(".").pop() ||
                    "bin",
                };
                const ext = extMap[messageType] || "bin";
                const filename = `inbound_${Date.now()}_${uuidv4().slice(0, 8)}.${ext}`;
                fs.writeFileSync(path.join(uploadsDir, filename), buffer);
                mediaUrl = `/uploads/${filename}`;

                if (messageType === "image") mediaMimeType = "image/jpeg";
                else if (messageType === "audio") mediaMimeType = "audio/ogg";
                else if (messageType === "video") mediaMimeType = "video/mp4";
                else if (messageType === "document")
                  mediaMimeType =
                    msg.message?.documentMessage?.mimetype ||
                    "application/octet-stream";

                this.logger.log(
                  `[Session ${configId}] Inbound ${messageType} downloaded to ${mediaUrl}`,
                  "BaileysWhatsAppProvider",
                );
              }
            } catch (dlErr) {
              this.logger.warn(
                `[Session ${configId}] Failed to download inbound media: ${dlErr}`,
                "BaileysWhatsAppProvider",
              );
            }
          }

          const event: ProviderWebhookEvent = {
            eventType: "message.inbound",
            providerType: PROVIDER_TYPES.BAILEYS,
            externalMessageId: msg.key.id || "",
            from,
            to,
            content,
            messageType,
            mediaUrl,
            status: MESSAGE_STATUS.RECEIVED,
            timestamp:
              msg.messageTimestamp?.toString() || new Date().toISOString(),
            rawPayload: msg as unknown as Record<string, unknown>,
          };

          await this.eventsService.recordFromWebhookEvent(event);

          if (effectiveSessionId) {
            await this.messageRepo.save({
              id: uuidv4(),
              sessionId: effectiveSessionId,
              externalMessageId: event.externalMessageId || "",
              direction: "inbound",
              from,
              to,
              type: messageType,
              content,
              mediaUrl,
              mediaMimeType,
              status: MESSAGE_STATUS.RECEIVED,
              rawPayload: event.rawPayload,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            // Dispatch webhook
            void this.webhookService.dispatch("message.received", {
              sessionId: effectiveSessionId,
              from,
              content,
              type: messageType,
              mediaUrl,
              mediaMimeType,
            });

            // Auto-reply & AI Bot: ONLY for 1-on-1 chats, ignore groups to prevent spam!
            const isGroup = from.endsWith("@g.us");
            if (!isGroup && content && !content.startsWith("[")) {
              // Verify session and provider config are currently ACTIVE before responding
              let isSessionActive = true;
              let sessionUserId: string | undefined;
              if (effectiveSessionId && this.sessionRepo) {
                try {
                  const sess = await this.sessionRepo.findById(effectiveSessionId);
                  if (!sess || sess.status !== "active") {
                    isSessionActive = false;
                  } else {
                    sessionUserId = sess.userId;
                    if (this.configRepo && sess.providerConfigId) {
                      const pCfg = await this.configRepo.findById(sess.providerConfigId);
                      if (pCfg && !pCfg.isActive) {
                        isSessionActive = false;
                      }
                    }
                  }
                } catch {
                  // continue
                }
              }

              if (!isSessionActive) {
                this.logger.log(
                  `Skipping Auto-reply & AI Bot for session ${effectiveSessionId}: session or provider config is disabled/inactive`,
                  "BaileysWhatsAppProvider",
                );
                return;
              }

              const now = Date.now();
              const lastTime = this.lastReplyTimeByJid.get(from) || 0;
              // 4 second anti-loop cooldown
              if (now - lastTime > 4000) {
                const senderPhone = from.split("@")[0].replace(/\D/g, "");
                const senderName = msg.pushName || undefined;
                let replyContent = await this.autoReplyService.match(
                  effectiveSessionId,
                  content,
                  senderName,
                  senderPhone,
                );
                if (!replyContent && this.aiBotService) {
                  const promptJid = from.includes("@")
                    ? from
                    : `${from}@s.whatsapp.net`;
                  try {
                    await sock.sendPresenceUpdate("composing", promptJid);
                  } catch {}

                  replyContent = await this.aiBotService.generateReply(
                    content,
                    from,
                    sessionUserId,
                    effectiveSessionId,
                  );
                }
                if (replyContent) {
                  this.lastReplyTimeByJid.set(from, now);
                  this.logger.log(
                    `Automated reply sent for session ${effectiveSessionId} to ${from}`,
                    "BaileysWhatsAppProvider",
                  );
                  const replyJid = from.includes("@")
                    ? from
                    : `${from}@s.whatsapp.net`;
                  try {
                    // 1. Simulate realistic human typing indicator ("composing") & anti-ban delay
                    try {
                      await sock.sendPresenceUpdate("composing", replyJid);
                    } catch {}

                    const delayMs = Math.min(
                      3000,
                      Math.max(1200, (replyContent.length || 20) * 20),
                    );
                    await new Promise((r) => setTimeout(r, delayMs));

                    try {
                      await sock.sendPresenceUpdate("paused", replyJid);
                    } catch {}

                    const sentMsg = await sock.sendMessage(replyJid, {
                      text: replyContent,
                    });

                    // Save bot reply to DB so it is recorded in Live Chat!
                    await this.messageRepo.save({
                      id: uuidv4(),
                      sessionId: effectiveSessionId,
                      externalMessageId: sentMsg?.key?.id || uuidv4(),
                      direction: "outbound",
                      from: sock.user?.id || "bot",
                      to: replyJid,
                      type: "text",
                      content: replyContent,
                      status: MESSAGE_STATUS.SENT,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                  } catch (err) {
                    this.logger.error(
                      `Auto-reply / AI send failed: ${err}`,
                      undefined,
                      "BaileysWhatsAppProvider",
                    );
                  }
                }
              }
            }
          }
        }
      }
    });

    sock.ev.on("messages.update", async (updates) => {
      for (const update of updates) {
        const updateKey = update.update;
        if (updateKey?.status !== undefined && updateKey.status !== null) {
          const statusMap: Record<number, MessageStatus> = {
            0: MESSAGE_STATUS.FAILED,
            1: MESSAGE_STATUS.QUEUED,
            2: MESSAGE_STATUS.SENT,
            3: MESSAGE_STATUS.DELIVERED,
            4: MESSAGE_STATUS.READ,
            5: MESSAGE_STATUS.READ,
          };

          const mappedStatus =
            statusMap[updateKey.status] || MESSAGE_STATUS.FAILED;

          const event: ProviderWebhookEvent = {
            eventType: `message.${mappedStatus}`,
            providerType: PROVIDER_TYPES.BAILEYS,
            externalMessageId: update.key.id || "",
            to: update.key.remoteJid || "",
            status: mappedStatus,
            timestamp: new Date().toISOString(),
            rawPayload: update as unknown as Record<string, unknown>,
          };

          await this.eventsService.recordFromWebhookEvent(event);

          if (event.externalMessageId) {
            const existing = await this.messageRepo.findByExternalMessageId(
              event.externalMessageId,
            );
            if (existing) {
              await this.messageRepo.update(existing.id, {
                status: event.status || MESSAGE_STATUS.FAILED,
              });
            }
          }
        }
      }
    });
  }

  async verifyWebhook(query: VerifyWebhookQuery): Promise<VerifyWebhookResult> {
    return { valid: false };
  }

  async handleWebhook(
    payload: unknown,
    headers?: Record<string, string>,
  ): Promise<ProviderWebhookEvent[]> {
    return [];
  }

  async sendTextMessage(
    input: SendTextMessageCommand,
  ): Promise<SendMessageResult> {
    const {
      to,
      message,
      type = "text",
      mediaUrl,
      mediaCaption,
      mediaMimeType,
      latitude,
      longitude,
      locationName,
      config,
      sessionId,
    } = input;

    const inst = this.findSession(config?.id, sessionId);
    if (!inst?.sock || !inst.connectionReady) {
      return {
        success: false,
        error: "Baileys WhatsApp socket is not connected for this session",
      };
    }

    try {
      let jid = to.trim();
      if (!jid.includes("@")) {
        if (jid.length >= 18 && jid.startsWith("120363")) {
          jid = `${jid}@g.us`;
        } else {
          jid = `${jid.replace(/\D/g, "")}@s.whatsapp.net`;
        }
      }
      jid = jid.replace(/:\d+@/, "@");

      // Resolve media source: read from local disk / Buffer if relative path
      let mediaSource: { url: string } | Buffer = { url: mediaUrl || "" };
      if (mediaUrl) {
        if (mediaUrl.startsWith("/uploads/")) {
          const localPath = path.join(process.cwd(), "public", mediaUrl);
          if (fs.existsSync(localPath)) {
            mediaSource = fs.readFileSync(localPath);
          }
        } else if (fs.existsSync(mediaUrl)) {
          mediaSource = fs.readFileSync(mediaUrl);
        }
      }

      // Human typing / presence simulation for anti-ban safety
      try {
        await inst.sock.presenceSubscribe(jid);
        await inst.sock.sendPresenceUpdate(type === "audio" ? "recording" : "composing", jid);
        const typingDelay = Math.floor(600 + Math.random() * 800);
        await new Promise((r) => setTimeout(r, typingDelay));
        await inst.sock.sendPresenceUpdate("paused", jid);
      } catch {
        // non-fatal if presence update fails
      }

      // Quoted / reply-to message context
      let sendOptions: Record<string, unknown> = {};
      if (input.quotedMessageId) {
        try {
          const quotedMsg = await this.messageRepo.findById(input.quotedMessageId);
          if (quotedMsg) {
            sendOptions.quoted = {
              key: {
                remoteJid: jid,
                id: quotedMsg.externalMessageId || quotedMsg.id,
                fromMe: quotedMsg.direction === "outbound",
              },
              message: {
                conversation: quotedMsg.content || "[Media / Pesan]",
              },
            };
          }
        } catch {
          // ignore quoted lookup failure
        }
      }

      let result: Awaited<ReturnType<typeof inst.sock.sendMessage>>;

      switch (type) {
        case "image":
          if (mediaMimeType === "image/svg+xml") {
            result = await inst.sock.sendMessage(
              jid,
              {
                document: mediaSource,
                caption: mediaCaption || message,
                mimetype: mediaMimeType,
                fileName: mediaCaption || "vector.svg",
              },
              sendOptions,
            );
          } else {
            result = await inst.sock.sendMessage(
              jid,
              {
                image: mediaSource,
                caption: mediaCaption || message,
                mimetype: mediaMimeType ?? "image/jpeg",
              },
              sendOptions,
            );
          }
          break;

        case "document":
          result = await inst.sock.sendMessage(
            jid,
            {
              document: mediaSource,
              caption: mediaCaption || message,
              mimetype: mediaMimeType ?? "application/octet-stream",
              fileName: mediaCaption || "file",
            },
            sendOptions,
          );
          break;

        case "audio":
          result = await inst.sock.sendMessage(
            jid,
            {
              audio: mediaSource,
              mimetype: mediaMimeType ?? "audio/mp4",
              ptt: true, // Voice Note mode
            },
            sendOptions,
          );
          break;

        case "video":
          result = await inst.sock.sendMessage(
            jid,
            {
              video: mediaSource,
              caption: mediaCaption || message,
              mimetype: mediaMimeType ?? "video/mp4",
            },
            sendOptions,
          );
          break;

        case "location":
          result = await inst.sock.sendMessage(
            jid,
            {
              location: {
                degreesLatitude: latitude ?? 0,
                degreesLongitude: longitude ?? 0,
                name: locationName,
              },
            },
            sendOptions,
          );
          break;

        default:
          result = await inst.sock.sendMessage(
            jid,
            { text: message },
            sendOptions,
          );
          break;
      }

      return {
        success: true,
        externalMessageId: result?.key?.id || undefined,
        rawResponse: result as unknown as Record<string, unknown>,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send message via Baileys: ${error}`,
        undefined,
        "BaileysWhatsAppProvider",
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getHealth(
    configId?: string,
    sessionId?: string,
  ): Promise<ProviderHealthResult> {
    if (configId || sessionId) {
      const inst = this.findSession(configId, sessionId);
      if (!inst) {
        return {
          healthy: false,
          providerType: PROVIDER_TYPES.BAILEYS,
          message: "No active Baileys session configured",
        };
      }

      return {
        healthy: inst.connectionReady,
        providerType: PROVIDER_TYPES.BAILEYS,
        message: inst.connectionReady
          ? `Connected as ${inst.sock?.user?.id || "active session"}`
          : inst.qrCodeData
            ? "Waiting for QR scan"
            : inst.isConnecting
              ? "Connecting..."
              : "Disconnected (Standby)",
      };
    }

    const total = this.sessions.size;
    const connected = Array.from(this.sessions.values()).filter(
      (s) => s.connectionReady,
    ).length;

    return {
      healthy: true,
      providerType: PROVIDER_TYPES.BAILEYS,
      message:
        total === 0
          ? "Baileys engine ready (standby, 0 sessions)"
          : `Baileys engine operational (${connected}/${total} connected)`,
    };
  }

  async sendReaction(
    sessionId: string,
    to: string,
    messageId: string,
    emoji: string,
  ): Promise<boolean> {
    const inst = this.findSession(undefined, sessionId);
    if (!inst?.sock || !inst.connectionReady) return false;

    let jid = to.trim();
    if (!jid.includes("@")) {
      jid = jid.startsWith("120363")
        ? `${jid}@g.us`
        : `${jid.replace(/\D/g, "")}@s.whatsapp.net`;
    }

    try {
      let keyId = messageId;
      let fromMe = false;
      const msg = await this.messageRepo.findById(messageId);
      if (msg) {
        keyId = msg.externalMessageId || msg.id;
        fromMe = msg.direction === "outbound";
      }

      await inst.sock.sendMessage(jid, {
        react: {
          text: emoji,
          key: {
            remoteJid: jid,
            id: keyId,
            fromMe,
          },
        },
      });
      return true;
    } catch (err) {
      this.logger.warn(
        `Failed to send reaction: ${err}`,
        "BaileysWhatsAppProvider",
      );
      return false;
    }
  }

  async deleteMessage(
    sessionId: string,
    to: string,
    messageId: string,
  ): Promise<boolean> {
    const inst = this.findSession(undefined, sessionId);
    if (!inst?.sock || !inst.connectionReady) return false;

    let jid = to.trim();
    if (!jid.includes("@")) {
      jid = jid.startsWith("120363")
        ? `${jid}@g.us`
        : `${jid.replace(/\D/g, "")}@s.whatsapp.net`;
    }

    try {
      let keyId = messageId;
      let fromMe = true;
      const msg = await this.messageRepo.findById(messageId);
      if (msg) {
        keyId = msg.externalMessageId || msg.id;
        fromMe = msg.direction === "outbound";
      }

      await inst.sock.sendMessage(jid, {
        delete: {
          remoteJid: jid,
          id: keyId,
          fromMe,
        },
      });

      if (msg) {
        await this.messageRepo.update(msg.id, {
          status: "deleted",
          content: "[Pesan ditarik / Dihapus untuk semua]",
        });
      }
      return true;
    } catch (err) {
      this.logger.warn(
        `Failed to delete message: ${err}`,
        "BaileysWhatsAppProvider",
      );
      return false;
    }
  }

  async markAsRead(
    sessionId: string,
    to: string,
    messageIds: string[],
  ): Promise<boolean> {
    const inst = this.findSession(undefined, sessionId);
    if (!inst?.sock || !inst.connectionReady) return false;

    try {
      let jid = to.trim();
      if (!jid.includes("@")) {
        if (jid.length >= 18 && jid.startsWith("120363")) {
          jid = `${jid}@g.us`;
        } else {
          jid = `${jid.replace(/\D/g, "")}@s.whatsapp.net`;
        }
      }
      jid = jid.replace(/:\d+@/, "@");

      const keys: Array<{ remoteJid: string; id: string; fromMe: boolean }> = [];

      for (const mId of messageIds) {
        let externalId = mId;
        const msg = await this.messageRepo.findById(mId);
        if (msg) {
          externalId = msg.externalMessageId || msg.id;
          await this.messageRepo.update(msg.id, { status: "read" });
        }
        keys.push({
          remoteJid: jid,
          id: externalId,
          fromMe: false,
        });
      }

      if (keys.length > 0) {
        await inst.sock.readMessages(keys);
      }
      return true;
    } catch (err) {
      this.logger.warn(
        `Failed to mark messages as read: ${err}`,
        "BaileysWhatsAppProvider",
      );
      return false;
    }
  }

  async disconnectAccount(
    sessionId?: string,
    configId?: string,
  ): Promise<boolean> {
    const inst = this.findSession(configId, sessionId);
    if (!inst) return false;

    this.logger.log(
      `Disconnecting Baileys WhatsApp socket for configId=${inst.configId} sessionId=${sessionId || "unknown"}`,
      "BaileysWhatsAppProvider",
    );

    try {
      if (inst.sock) {
        try {
          inst.sock.ev.removeAllListeners("messages.upsert");
          inst.sock.ev.removeAllListeners("messages.update");
          inst.sock.ev.removeAllListeners("connection.update");
          inst.sock.end(new Error("Account deactivated by user"));
        } catch {}
      }
      inst.connectionReady = false;
      inst.isConnecting = false;
      inst.qrCodeData = null;
      inst.pairingCode = null;

      this.sessions.delete(inst.configId);
      if (sessionId) {
        this.sessionToConfig.delete(sessionId);
      }
      return true;
    } catch (err) {
      this.logger.warn(
        `Error disconnecting Baileys socket: ${err}`,
        "BaileysWhatsAppProvider",
      );
      return false;
    }
  }

  isConnected(configId?: string, sessionId?: string): boolean {
    return this.findSession(configId, sessionId)?.connectionReady ?? false;
  }

  isConnectingState(configId?: string, sessionId?: string): boolean {
    return this.findSession(configId, sessionId)?.isConnecting ?? false;
  }

  getQrCodeData(configId?: string, sessionId?: string): string | null {
    return this.findSession(configId, sessionId)?.qrCodeData ?? null;
  }

  getPairingCode(configId?: string, sessionId?: string): string | null {
    return this.findSession(configId, sessionId)?.pairingCode ?? null;
  }

  async requestPairingCode(
    phoneNumber: string,
    configId?: string,
  ): Promise<string | null> {
    const inst = this.findSession(configId);
    if (!inst?.sock) {
      this.logger.error(
        "Socket not initialized - connect account first",
        undefined,
        "BaileysWhatsAppProvider",
      );
      return null;
    }

    try {
      const cleanNumber = phoneNumber.replace(/\D/g, "");
      if (cleanNumber.length < 10) {
        this.logger.error(
          `Invalid phone number format for pairing: ${cleanNumber}. Make sure it includes country code.`,
          undefined,
          "BaileysWhatsAppProvider",
        );
        return null;
      }
      this.logger.log(
        `Requesting pairing code for: ${cleanNumber}`,
        "BaileysWhatsAppProvider",
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));
      const code = await inst.sock.requestPairingCode(cleanNumber);
      inst.pairingCode = code;
      inst.phoneNumber = cleanNumber;

      this.logger.log(
        `Pairing code generated: ${code}`,
        "BaileysWhatsAppProvider",
      );
      return code;
    } catch (error) {
      this.logger.error(
        `Failed to request pairing code: ${error}`,
        undefined,
        "BaileysWhatsAppProvider",
      );
      return null;
    }
  }

  private clearSession(id: string) {
    const sessionDir = this.getAuthDir(id);
    const storeFile = path.join(
      path.dirname(sessionDir),
      `baileys_store_${id}.json`,
    );
    if (fs.existsSync(sessionDir)) {
      this.logger.log(
        `Removing session directory: ${sessionDir}`,
        "BaileysWhatsAppProvider",
      );
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    if (fs.existsSync(storeFile)) {
      this.logger.log(
        `Removing store file: ${storeFile}`,
        "BaileysWhatsAppProvider",
      );
      fs.unlinkSync(storeFile);
    }
    const inst = this.sessions.get(id);
    if (inst) {
      inst.store = null;
      inst.connectionReady = false;
      inst.sock = null;
    }
  }

  async getGroups(
    sessionId?: string,
    configId?: string,
  ): Promise<
    Array<{
      id: string;
      subject: string;
      participantsCount: number;
      creation?: number;
      owner?: string;
    }>
  > {
    const inst = this.findSession(configId, sessionId);
    if (!inst?.sock || !inst.connectionReady) {
      return [];
    }
    try {
      const groups = await inst.sock.groupFetchAllParticipating();
      return Object.values(groups).map((g) => ({
        id: g.id,
        subject: g.subject,
        participantsCount: g.participants?.length || 0,
        creation: g.creation,
        owner: g.owner,
      }));
    } catch (err) {
      this.logger.error(
        `Failed to fetch groups: ${err}`,
        undefined,
        "BaileysWhatsAppProvider",
      );
      return [];
    }
  }

  async syncContacts(
    sessionId?: string,
    configId?: string,
  ): Promise<Array<{ phone: string; name: string; jid: string }>> {
    const inst = this.findSession(configId, sessionId);
    if (!inst?.sock || !inst.connectionReady) {
      return [];
    }

    const contactsMap = new Map<
      string,
      { phone: string; name: string; jid: string }
    >();

    try {
      const groups = await inst.sock.groupFetchAllParticipating();
      for (const group of Object.values(groups)) {
        if (group.participants) {
          for (const p of group.participants) {
            const rawPhone = p.id
              .split("@")[0]
              .split(":")[0]
              .replace(/\D/g, "");
            if (rawPhone.length >= 7 && !contactsMap.has(rawPhone)) {
              contactsMap.set(rawPhone, {
                phone: rawPhone,
                name: `WA Contact (${rawPhone.slice(-4)})`,
                jid: p.id,
              });
            }
          }
        }
      }
    } catch (err) {
      this.logger.warn(
        `Could not sync contacts from groups: ${err}`,
        "BaileysWhatsAppProvider",
      );
    }

    return Array.from(contactsMap.values());
  }
}
