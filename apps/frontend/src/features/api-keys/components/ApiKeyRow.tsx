import { useState } from "react";
import { ApiKey } from "../../../api/client";
import IpWhitelistPanel from "./IpWhitelistPanel";
import {
  Check,
  Copy,
  Trash2,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface Props {
  apiKey: ApiKey;
  onRevoke: (id: string) => void;
  fmt: (iso?: string) => string;
  isExpired: (iso?: string) => boolean;
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

export default function ApiKeyRow({
  apiKey: k,
  onRevoke,
  fmt,
  isExpired,
}: Props) {
  const [showIp, setShowIp] = useState(false);
  const { copied, copy } = useCopy();

  return (
    <div>
      <div className="flex items-center gap-4 px-5 py-3">
        {/* Name + prefix */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200">{k.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <code className="text-xs text-brand-400 font-mono bg-brand-900/20 px-1.5 py-0.5 rounded">
              {k.keyPrefix}…
            </code>
            <button
              onClick={() => copy(k.keyPrefix, k.id)}
              className="text-gray-600 hover:text-gray-400"
            >
              {copied === k.id ? (
                <Check className="w-3 h-3 text-brand-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Meta */}
        <span className="text-xs text-gray-500 hidden sm:block">
          Last used: {fmt(k.lastUsedAt)}
        </span>
        <span
          className={`text-xs hidden sm:block ${isExpired(k.expiresAt) ? "text-red-400" : "text-gray-500"}`}
        >
          Exp: {fmt(k.expiresAt)}
        </span>

        {/* Status */}
        {k.isActive && !isExpired(k.expiresAt) ? (
          <span className="inline-flex items-center gap-1 text-xs text-brand-400">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            {isExpired(k.expiresAt) ? "Expired" : "Revoked"}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIp((v) => !v)}
            className="btn-secondary text-xs"
            title="IP Whitelist"
          >
            <Shield className="w-3.5 h-3.5" />
            {showIp ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          {k.isActive && (
            <button
              onClick={() => onRevoke(k.id)}
              className="btn-danger text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Revoke
            </button>
          )}
        </div>
      </div>

      {showIp && <IpWhitelistPanel apiKeyId={k.id} />}
    </div>
  );
}
