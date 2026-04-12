import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

export function CodeBlock({
  code,
  id,
  lang = "json",
}: {
  code: string;
  id: string;
  lang?: string;
}) {
  const { copied, copy } = useCopy();
  return (
    <div className="relative group my-3">
      <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-xs text-gray-300 overflow-x-auto font-mono leading-relaxed whitespace-pre">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copy(code, id)}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-all"
      >
        {copied === id ? (
          <Check className="w-3.5 h-3.5 text-brand-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

export function Badge({ method }: { method: string }) {
  const c: Record<string, string> = {
    POST: "bg-brand-500/15 text-brand-400 border-brand-800/50",
    GET: "bg-blue-500/15 text-blue-400 border-blue-800/50",
    PATCH: "bg-yellow-500/15 text-yellow-400 border-yellow-800/50",
    DELETE: "bg-red-500/15 text-red-400 border-red-800/50",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${c[method] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}
    >
      {method}
    </span>
  );
}

export function Field({
  name,
  type,
  required,
  desc,
}: {
  name: string;
  type: string;
  required?: boolean;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-800/60 last:border-0">
      <div className="w-36 shrink-0">
        <code className="text-xs text-brand-400 font-mono">{name}</code>
        {required && <span className="ml-1 text-[10px] text-red-400">*</span>}
      </div>
      <div className="w-16 shrink-0 text-[10px] text-gray-600 font-mono pt-0.5">
        {type}
      </div>
      <p className="text-xs text-gray-400 flex-1">{desc}</p>
    </div>
  );
}

export function Note({
  children,
  type = "info",
}: {
  children: React.ReactNode;
  type?: "info" | "warning" | "tip";
}) {
  const styles = {
    info: "bg-blue-900/20 border-blue-800/40 text-blue-300",
    warning: "bg-yellow-900/20 border-yellow-800/40 text-yellow-300",
    tip: "bg-brand-900/20 border-brand-800/40 text-brand-300",
  };
  const icons = { info: "ℹ️", warning: "⚠️", tip: "💡" };
  return (
    <div
      className={`flex gap-2.5 px-4 py-3 rounded-lg border text-xs leading-relaxed my-3 ${styles[type]}`}
    >
      <span className="shrink-0">{icons[type]}</span>
      <div>{children}</div>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-white mt-6 mb-3">{children}</h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-200 mt-4 mb-2">
      {children}
    </h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-gray-400 leading-relaxed mb-3">{children}</p>
  );
}
