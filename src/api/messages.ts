import { request } from "./base";

export interface Message {
  id: string;
  sessionId: string;
  externalMessageId?: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  type: "text" | "image" | "document" | "audio" | "video" | "location";
  content: string;
  mediaUrl?: string;
  mediaCaption?: string;
  mediaMimeType?: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed" | "received";
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageBody {
  sessionId: string;
  to: string;
  message: string;
  type?: string;
  mediaUrl?: string;
  mediaCaption?: string;
  mediaMimeType?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export const messagesApi = {
  list: () => request<Message[]>("/messages"),
  get: (id: string) => request<Message>(`/messages/${id}`),
  send: (body: SendMessageBody) =>
    request<Message>("/messages/send", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
