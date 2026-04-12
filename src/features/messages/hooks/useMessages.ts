import { useState, useEffect } from "react";
import {
  messagesApi,
  sessionsApi,
  Message,
  Session,
} from "../../../api/client";
import { SendForm } from "../constants";

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [m, s] = await Promise.all([messagesApi.list(), sessionsApi.list()]);
    if (m.data) setMessages([...m.data].reverse());
    if (s.data) setSessions(s.data.filter((s) => s.status === "active"));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const send = async (form: SendForm) => {
    const payload: Record<string, unknown> = {
      sessionId: form.sessionId,
      to: form.to,
      message: form.message,
      type: form.type,
    };
    if (form.type !== "text" && form.type !== "location") {
      if (form.mediaUrl) payload.mediaUrl = form.mediaUrl;
      if (form.mediaCaption) payload.mediaCaption = form.mediaCaption;
      if (form.mediaMimeType) payload.mediaMimeType = form.mediaMimeType;
    }
    if (form.type === "location") {
      payload.latitude = parseFloat(form.latitude);
      payload.longitude = parseFloat(form.longitude);
      payload.locationName = form.locationName;
    }
    const res = await messagesApi.send(
      payload as Parameters<typeof messagesApi.send>[0],
    );
    if (res.success) await load();
    return res;
  };

  const exportMessages = (
    format: "csv" | "json",
    filters: { status?: string; direction?: string },
  ) => {
    const params = new URLSearchParams({ format });
    if (filters.status) params.set("status", filters.status);
    if (filters.direction) params.set("direction", filters.direction);
    const token = localStorage.getItem("token");
    const a = document.createElement("a");
    a.href = `http://localhost:3000/export/messages?${params.toString()}&_token=${token}`;
    a.download = "";
    a.click();
  };

  const filter = (
    msgs: Message[],
    search: string,
    status: string,
    direction: string,
  ) =>
    msgs.filter((m) => {
      if (status && m.status !== status) return false;
      if (direction && m.direction !== direction) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.content.toLowerCase().includes(q) ||
          m.from.includes(q) ||
          m.to.includes(q)
        );
      }
      return true;
    });

  return { messages, sessions, loading, load, send, exportMessages, filter };
}
