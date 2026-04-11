import { useState } from "react";
import { Copy, Check, BookOpen, Key, Send, AlertCircle } from "lucide-react";

const BASE = "http://localhost:3000";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

function CodeBlock({ code, id }: { code: string; id: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="relative group">
      <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto font-mono leading-relaxed whitespace-pre">
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

function Field({
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
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-800 last:border-0">
      <div className="w-36 shrink-0">
        <code className="text-xs text-brand-400 font-mono">{name}</code>
        {required && <span className="ml-1 text-[10px] text-red-400">*</span>}
      </div>
      <div className="w-16 shrink-0">
        <span className="text-[10px] text-gray-600 font-mono">{type}</span>
      </div>
      <p className="text-xs text-gray-400 flex-1">{desc}</p>
    </div>
  );
}

// ── snippets ──────────────────────────────────────────────────────────────────

const curlSend = `curl -X POST ${BASE}/v1/messages/send \\
  -H "X-API-Key: wai_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "YOUR_SESSION_ID",
    "to": "628123456789",
    "message": "Hello from my app!"
  }'`;

const jsSend = `const response = await fetch("${BASE}/v1/messages/send", {
  method: "POST",
  headers: {
    "X-API-Key": "wai_live_YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    session_id: "YOUR_SESSION_ID",
    to: "628123456789",
    message: "Hello from my app!",
  }),
});

const data = await response.json();
// data.data.message_id — ID of the sent message`;

const phpSend = `<?php
$response = file_get_contents("${BASE}/v1/messages/send", false,
  stream_context_create([
    "http" => [
      "method"  => "POST",
      "header"  => implode("\\r\\n", [
        "X-API-Key: wai_live_YOUR_API_KEY",
        "Content-Type: application/json",
      ]),
      "content" => json_encode([
        "session_id" => "YOUR_SESSION_ID",
        "to"         => "628123456789",
        "message"    => "Hello from my app!",
      ]),
    ],
  ])
);
$data = json_decode($response, true);`;

const pythonSend = `import requests

response = requests.post(
    "${BASE}/v1/messages/send",
    headers={
        "X-API-Key": "wai_live_YOUR_API_KEY",
        "Content-Type": "application/json",
    },
    json={
        "session_id": "YOUR_SESSION_ID",
        "to": "628123456789",
        "message": "Hello from my app!",
    },
)
data = response.json()`;

const successResponse = `{
  "success": true,
  "message": "OK",
  "data": {
    "message_id": "msg_abc123",
    "session_id": "YOUR_SESSION_ID",
    "to": "628123456789",
    "status": "sent",
    "sent_at": "2026-04-11T14:00:00.000Z"
  },
  "error": null,
  "timestamp": "2026-04-11T14:00:00.000Z"
}`;

const errorResponse = `// 401 — Missing or invalid API key
{
  "success": false,
  "message": "Invalid or expired API key",
  "data": null,
  "error": { "code": "UNAUTHORIZED", "details": null }
}

// 400 — Session not active
{
  "success": false,
  "message": "Session YOUR_SESSION_ID is not active",
  "data": null,
  "error": { "code": "BAD_REQUEST", "details": null }
}`;

// ── page ──────────────────────────────────────────────────────────────────────

export default function Docs() {
  const [lang, setLang] = useState<"curl" | "js" | "php" | "python">("curl");

  const snippet =
    lang === "curl"
      ? curlSend
      : lang === "js"
        ? jsSend
        : lang === "php"
          ? phpSend
          : pythonSend;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-400" />
          API Reference
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Base URL:{" "}
          <code className="text-brand-400 font-mono text-xs">{BASE}</code>
        </p>
      </div>

      {/* Step 1 — Get API Key */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-600/20 text-brand-400 text-xs font-bold flex items-center justify-center shrink-0">
            1
          </span>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-400" />
            Get an API Key
          </h2>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Go to{" "}
          <a href="/api-keys" className="text-brand-400 hover:underline">
            API Keys
          </a>{" "}
          in the sidebar, create a new key, and copy it. The key is shown only
          once — store it securely.
        </p>
        <div className="bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 font-mono text-xs text-brand-300">
          wai_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        </div>
      </div>

      {/* Step 2 — Get Session ID */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-600/20 text-brand-400 text-xs font-bold flex items-center justify-center shrink-0">
            2
          </span>
          <h2 className="text-sm font-semibold text-white">
            Get your Session ID
          </h2>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Go to{" "}
          <a href="/sessions" className="text-brand-400 hover:underline">
            Sessions
          </a>
          , make sure your session is{" "}
          <strong className="text-white">active</strong>, and copy the session
          ID from the table.
        </p>
      </div>

      {/* Step 3 — Send */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-600/20 text-brand-400 text-xs font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-brand-400" />
              Send a Message
            </h2>
          </div>
          <div className="flex gap-1">
            {(["curl", "js", "php", "python"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  lang === l
                    ? "bg-brand-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200"
                }`}
              >
                {l === "js" ? "JS" : l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint badge */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-brand-500/15 text-brand-400 border-brand-800/50 font-mono">
            POST
          </span>
          <code className="text-xs text-gray-300 font-mono">
            /v1/messages/send
          </code>
        </div>

        <CodeBlock code={snippet} id="send-snippet" />
      </div>

      {/* Request fields */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Request Fields</h2>
        </div>
        <div className="px-5 py-2">
          <div className="flex items-start gap-3 py-2 border-b border-gray-800">
            <div className="w-36 shrink-0 text-[10px] font-medium text-gray-600 uppercase tracking-wide">
              Field
            </div>
            <div className="w-16 shrink-0 text-[10px] font-medium text-gray-600 uppercase tracking-wide">
              Type
            </div>
            <div className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
              Description
            </div>
          </div>
          <Field
            name="session_id"
            type="string"
            required
            desc="ID of an active session. Get it from the Sessions page."
          />
          <Field
            name="to"
            type="string"
            required
            desc="Recipient phone number with country code. No + or spaces. Example: 628123456789"
          />
          <Field
            name="message"
            type="string"
            required
            desc="Text message content. Max 4096 characters."
          />
        </div>
      </div>

      {/* Headers */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Required Headers</h2>
        </div>
        <div className="px-5 py-2">
          <Field
            name="X-API-Key"
            type="string"
            required
            desc="Your API key. Format: wai_live_..."
          />
          <Field
            name="Content-Type"
            type="string"
            required
            desc="Must be application/json"
          />
        </div>
      </div>

      {/* Response */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Response</h2>

        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">
            ✅ Success (200)
          </p>
          <CodeBlock code={successResponse} id="success-res" />
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">
            ❌ Error responses
          </p>
          <CodeBlock code={errorResponse} id="error-res" />
        </div>
      </div>

      {/* Notes */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          Notes
        </h2>
        <ul className="space-y-2">
          {[
            "Session must be active before sending. Activate it from the Sessions page.",
            "Phone number format: country code + number, no + or spaces (e.g. 628123456789 for Indonesia).",
            "API keys are hashed — we cannot recover a lost key. Revoke and create a new one if lost.",
            "Rate limiting may apply in production environments.",
          ].map((note, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-gray-400"
            >
              <span className="text-brand-500 mt-0.5 shrink-0">•</span>
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
