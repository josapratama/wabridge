import { useState, useEffect } from "react";
import {
  webhookEndpointsApi,
  WebhookEndpoint,
  WebhookLog,
} from "../../../api/client";

export function useWebhooks() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await webhookEndpointsApi.list();
    if (res.data) setEndpoints(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (form: {
    name: string;
    url: string;
    secret?: string;
    events: string[];
  }) => {
    const res = await webhookEndpointsApi.create(form);
    if (res.success) await load();
    return res;
  };

  const toggleActive = async (ep: WebhookEndpoint) => {
    await webhookEndpointsApi.update(ep.id, { isActive: !ep.isActive });
    await load();
  };

  const remove = async (id: string) => {
    await webhookEndpointsApi.delete(id);
    await load();
  };

  const fetchLogs = async (id: string) => {
    setLogsLoading(true);
    const res = await webhookEndpointsApi.getLogs(id);
    if (res.data) setLogs(res.data);
    setLogsLoading(false);
  };

  return {
    endpoints,
    loading,
    load,
    create,
    toggleActive,
    remove,
    logs,
    logsLoading,
    fetchLogs,
  };
}
