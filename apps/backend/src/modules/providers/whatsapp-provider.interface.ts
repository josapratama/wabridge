import type {
  ConnectAccountCommand,
  ProviderAccountResult,
  ProviderHealthResult,
  ProviderWebhookEvent,
  SendMessageResult,
  SendTextMessageCommand,
  VerifyWebhookQuery,
  VerifyWebhookResult,
} from "../../common/types";

export interface WhatsAppProvider {
  connectAccount(input: ConnectAccountCommand): Promise<ProviderAccountResult>;
  verifyWebhook(query: VerifyWebhookQuery): Promise<VerifyWebhookResult>;
  handleWebhook(
    payload: unknown,
    headers?: Record<string, string>,
  ): Promise<ProviderWebhookEvent[]>;
  sendTextMessage(input: SendTextMessageCommand): Promise<SendMessageResult>;
  getHealth(configId?: string, sessionId?: string): Promise<ProviderHealthResult>;
  sendReaction?(sessionId: string, to: string, messageId: string, emoji: string): Promise<boolean>;
  deleteMessage?(sessionId: string, to: string, messageId: string): Promise<boolean>;
  markAsRead?(sessionId: string, to: string, messageIds: string[]): Promise<boolean>;
}
