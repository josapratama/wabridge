import { useState, useEffect } from "react";
import {
  broadcastApi,
  sessionsApi,
  contactsApi,
  BroadcastJob,
  Session,
  Contact,
} from "../../../api/client";

export function useBroadcast() {
  const [jobs, setJobs] = useState<BroadcastJob[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [j, s, c] = await Promise.all([
      broadcastApi.list(),
      sessionsApi.list(),
      contactsApi.list(),
    ]);
    if (j.data) setJobs([...j.data].reverse());
    if (s.data) setSessions(s.data.filter((s) => s.status === "active"));
    if (c.data) setContacts(c.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (params: {
    name: string;
    sessionId: string;
    content: string;
    recipients: string[];
    delayMs: number;
  }) => {
    const res = await broadcastApi.create(params);
    if (res.success && res.data) {
      await broadcastApi.start(res.data.id);
      await load();
    }
    return res;
  };

  const start = async (id: string) => {
    await broadcastApi.start(id);
    await load();
  };

  const cancel = async (id: string) => {
    await broadcastApi.cancel(id);
    await load();
  };

  const allTags = [...new Set(contacts.flatMap((c) => c.tags))];

  return {
    jobs,
    sessions,
    contacts,
    loading,
    load,
    create,
    start,
    cancel,
    allTags,
  };
}
