import { useState, useEffect } from "react";
import {
  autoReplyApi,
  sessionsApi,
  AutoReplyRule,
  Session,
} from "../../../api/client";

export type MatchType = "contains" | "exact" | "starts_with" | "regex";

export const MATCH_TYPES = [
  {
    value: "contains" as MatchType,
    label: "Contains",
    desc: "Message includes the keyword",
  },
  {
    value: "exact" as MatchType,
    label: "Exact",
    desc: "Message matches exactly",
  },
  {
    value: "starts_with" as MatchType,
    label: "Starts with",
    desc: "Message begins with keyword",
  },
  {
    value: "regex" as MatchType,
    label: "Regex",
    desc: "Advanced pattern matching",
  },
] as const;

export const EMPTY_FORM = {
  name: "",
  sessionId: "",
  matchType: "contains" as MatchType,
  matchValue: "",
  replyContent: "",
  priority: 0,
};

export type RuleForm = typeof EMPTY_FORM;

export function useAutoReply() {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [r, s] = await Promise.all([autoReplyApi.list(), sessionsApi.list()]);
    if (r.data) setRules([...r.data].sort((a, b) => b.priority - a.priority));
    if (s.data) setSessions(s.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (form: RuleForm) => {
    const payload = {
      ...form,
      sessionId: form.sessionId || undefined,
      isActive: true,
    };
    const res = await autoReplyApi.create(payload);
    if (res.success) await load();
    return res;
  };

  const update = async (id: string, form: RuleForm) => {
    const payload = { ...form, sessionId: form.sessionId || undefined };
    const res = await autoReplyApi.update(id, payload);
    if (res.success) await load();
    return res;
  };

  const toggleActive = async (rule: AutoReplyRule) => {
    await autoReplyApi.update(rule.id, { isActive: !rule.isActive });
    await load();
  };

  const remove = async (id: string) => {
    await autoReplyApi.delete(id);
    await load();
  };

  const sessionName = (id?: string) => {
    if (!id) return "All sessions";
    return sessions.find((s) => s.id === id)?.name ?? id.slice(0, 8) + "…";
  };

  return {
    rules,
    sessions,
    loading,
    load,
    create,
    update,
    toggleActive,
    remove,
    sessionName,
  };
}
