import { useState, useEffect } from "react";
import { messageTemplatesApi, MessageTemplate } from "../../../api/client";

export function extractVars(content: string): string[] {
  return [
    ...new Set(
      (content.match(/\{\{(\w+)\}\}/g) ?? []).map((m) => m.slice(2, -2)),
    ),
  ];
}

export function useTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await messageTemplatesApi.list();
    if (res.data) setTemplates(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (form: { name: string; content: string }) => {
    const res = await messageTemplatesApi.create(form);
    if (res.success) await load();
    return res;
  };

  const update = async (
    id: string,
    form: { name: string; content: string },
  ) => {
    const res = await messageTemplatesApi.update(id, form);
    if (res.success) await load();
    return res;
  };

  const remove = async (id: string) => {
    await messageTemplatesApi.delete(id);
    await load();
  };

  const renderTemplate = async (
    id: string,
    variables: Record<string, string>,
  ) => {
    const res = await messageTemplatesApi.render(id, variables);
    return res.data as unknown as string | null;
  };

  return { templates, loading, load, create, update, remove, renderTemplate };
}
