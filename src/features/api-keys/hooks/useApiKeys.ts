import { useState, useEffect } from "react";
import { apiKeysApi, ApiKey } from "../../../api/client";

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await apiKeysApi.list();
    if (res.data) setKeys(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (name: string, expiresAt?: string) => {
    const res = await apiKeysApi.create({ name, expiresAt });
    if (res.success) await load();
    return res;
  };

  const revoke = async (id: string) => {
    await apiKeysApi.revoke(id);
    await load();
  };

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : "—";
  const isExpired = (iso?: string) =>
    iso ? new Date(iso) < new Date() : false;

  return { keys, loading, load, create, revoke, fmt, isExpired };
}
