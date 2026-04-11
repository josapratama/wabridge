import { useState } from "react";
import {
  Copy,
  Check,
  BookOpen,
  Send,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

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

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    POST: "bg-brand-500/15 text-brand-400 border-brand-800/50",
    GET: "bg-blue-500/15 text-blue-400 border-blue-800/50",
    DELETE: "bg-red-500/15 text-red-400 border-red-800/50",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${colors[method] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}
    >
      {method}
    </span>
  );
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/40 transition-colors"
      >
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {open && <div className="border-t border-gray-800">{children}</div>}
    </div>
  );
}

function Endpoint({
  method,
  path,
  desc,
  fields,
  response,
  note,
}: {
  method: string;
  path: string;
  desc: string;
  fields?: React.ReactNode;
  response: string;
  note?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-800/30 transition-colors"
      >
        <MethodBadge method={method} />
        <code className="text-xs text-gray-300 font-mono flex-1">{path}</code>
        <span className="text-xs text-gray-500 hidden sm:block">{desc}</span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-3 bg-gray-900/40">
          <p className="text-xs text-gray-400 pt-1">{desc}</p>
          {note && (
            <p className="text-xs text-yellow-500/80 bg-yellow-900/20 border border-yellow-900/40 rounded px-3 py-2">
              {note}
            </p>
          )}
          {fields && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5 font-medium">
                Request Body
              </p>
              <div className="card px-4 py-1">{fields}</div>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Response</p>
            <CodeBlock code={response} id={`${method}-${path}`} />
          </div>
        </div>
      )}
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

const jsSend = `const res = await fetch("${BASE}/v1/messages/send", {
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
const data = await res.json();`;

const phpSend = `<?php
$ch = curl_init("${BASE}/v1/messages/send");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "X-API-Key: wai_live_YOUR_API_KEY",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "session_id" => "YOUR_SESSION_ID",
    "to"         => "628123456789",
    "message"    => "Hello from my app!",
  ]),
]);
$data = json_decode(curl_exec($ch), true);`;

const pythonSend = `import requests

res = requests.post(
    "${BASE}/v1/messages/send",
    headers={"X-API-Key": "wai_live_YOUR_API_KEY"},
    json={
        "session_id": "YOUR_SESSION_ID",
        "to": "628123456789",
        "message": "Hello from my app!",
    },
)
data = res.json()`;

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
          {" · "}
          Auth:{" "}
          <code className="text-brand-400 font-mono text-xs">
            X-API-Key
          </code>{" "}
          header
        </p>
      </div>

      {/* Quick start steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            n: "1",
            title: "Get API Key",
            desc: "Go to API Keys → create a key → copy it once",
            href: "/api-keys",
          },
          {
            n: "2",
            title: "Get Session ID",
            desc: "Go to Sessions → activate a session → copy its ID",
            href: "/sessions",
          },
          {
            n: "3",
            title: "Send Request",
            desc: "Call POST /v1/messages/send with your key and session",
            href: null,
          },
        ].map((step) => (
          <div key={step.n} className="card p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                {step.n}
              </span>
              <p className="text-xs font-semibold text-white">{step.title}</p>
            </div>
            <p className="text-xs text-gray-500">{step.desc}</p>
            {step.href && (
              <a
                href={step.href}
                className="text-[10px] text-brand-400 hover:underline"
              >
                Open →
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Quick send */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-brand-400" />
            Quick Start — Send a Message
          </h2>
          <div className="flex gap-1">
            {(["curl", "js", "php", "python"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${lang === l ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}
              >
                {l === "js" ? "JS" : l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MethodBadge method="POST" />
          <code className="text-xs text-gray-300 font-mono">
            /v1/messages/send
          </code>
        </div>
        <CodeBlock code={snippet} id="quick-send" />
      </div>

      {/* ── Messaging ── */}
      <Section title="💬 Messaging" defaultOpen>
        <Endpoint
          method="POST"
          path="/v1/messages/send"
          desc="Send a WhatsApp message (text, image, document, audio, video, location)"
          note="Session must be active. Sandbox mode: add sandbox: true to skip actual sending."
          fields={
            <>
              <Field
                name="session_id"
                type="string"
                required
                desc="Active session ID"
              />
              <Field
                name="to"
                type="string"
                required
                desc="Recipient phone with country code. e.g. 628123456789"
              />
              <Field
                name="message"
                type="string"
                required
                desc="Text content (max 4096 chars)"
              />
              <Field
                name="type"
                type="string"
                desc="Message type: text | image | document | audio | video | location (default: text)"
              />
              <Field
                name="media_url"
                type="string"
                desc="URL of media file (required for image/document/audio/video)"
              />
              <Field
                name="caption"
                type="string"
                desc="Caption for image/document/video"
              />
              <Field
                name="latitude"
                type="number"
                desc="Latitude for location type"
              />
              <Field
                name="longitude"
                type="number"
                desc="Longitude for location type"
              />
              <Field
                name="sandbox"
                type="boolean"
                desc="If true, returns fake success without sending"
              />
            </>
          }
          response={`{
  "success": true,
  "data": {
    "message_id": "msg_abc123",
    "session_id": "sess_abc123",
    "to": "628123456789",
    "status": "sent",
    "sent_at": "2026-04-11T14:00:00.000Z"
  }
}`}
        />

        <Endpoint
          method="POST"
          path="/v1/messages/broadcast"
          desc="Send a message to multiple recipients with delay between each"
          note="Max 1000 recipients. Min delay 500ms recommended to avoid WhatsApp ban."
          fields={
            <>
              <Field
                name="session_id"
                type="string"
                required
                desc="Active session ID"
              />
              <Field
                name="recipients"
                type="string[]"
                required
                desc="Array of phone numbers"
              />
              <Field
                name="message"
                type="string"
                required
                desc="Message content"
              />
              <Field
                name="delay_ms"
                type="number"
                desc="Delay between messages in ms (default: 2000)"
              />
              <Field
                name="sandbox"
                type="boolean"
                desc="If true, returns fake success without sending"
              />
            </>
          }
          response={`{
  "success": true,
  "data": {
    "job_id": "broadcast_abc123",
    "total": 50,
    "status": "running"
  }
}`}
        />

        <Endpoint
          method="GET"
          path="/v1/messages"
          desc="List messages with optional filters"
          fields={
            <>
              <Field name="session_id" type="query" desc="Filter by session" />
              <Field
                name="status"
                type="query"
                desc="Filter by status: sent | delivered | read | failed | received"
              />
              <Field
                name="direction"
                type="query"
                desc="Filter by direction: inbound | outbound"
              />
              <Field
                name="limit"
                type="query"
                desc="Max results (default: 50)"
              />
            </>
          }
          response={`{
  "success": true,
  "data": [
    {
      "id": "msg_abc123",
      "direction": "outbound",
      "from": "628987654321",
      "to": "628123456789",
      "type": "text",
      "content": "Hello!",
      "status": "delivered",
      "createdAt": "2026-04-11T14:00:00.000Z"
    }
  ]
}`}
        />
      </Section>

      {/* ── Media Types ── */}
      <Section title="🖼️ Media Message Examples">
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-400">
            Examples for sending different message types via{" "}
            <code className="text-brand-400">/v1/messages/send</code>:
          </p>
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Image</p>
            <CodeBlock
              id="ex-image"
              code={`{
  "session_id": "YOUR_SESSION_ID",
  "to": "628123456789",
  "message": "Check this out",
  "type": "image",
  "media_url": "https://example.com/photo.jpg",
  "caption": "My photo"
}`}
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Document</p>
            <CodeBlock
              id="ex-doc"
              code={`{
  "session_id": "YOUR_SESSION_ID",
  "to": "628123456789",
  "message": "Invoice",
  "type": "document",
  "media_url": "https://example.com/invoice.pdf",
  "caption": "Invoice #001"
}`}
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Location</p>
            <CodeBlock
              id="ex-loc"
              code={`{
  "session_id": "YOUR_SESSION_ID",
  "to": "628123456789",
  "message": "Our office",
  "type": "location",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "locationName": "Jakarta, Indonesia"
}`}
            />
          </div>
        </div>
      </Section>

      {/* ── Sandbox ── */}
      <Section title="🧪 Sandbox Mode">
        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-400">
            Add <code className="text-brand-400">sandbox: true</code> to any
            send request to test your integration without actually sending
            messages.
          </p>
          <CodeBlock
            id="sandbox-ex"
            code={`{
  "session_id": "YOUR_SESSION_ID",
  "to": "628123456789",
  "message": "Test message",
  "sandbox": true
}

// Response:
{
  "success": true,
  "data": {
    "message_id": "sandbox_1712844000000",
    "status": "sandbox",
    "sandbox": true
  }
}`}
          />
        </div>
      </Section>

      {/* ── Rate Limits ── */}
      <Section title="⚡ Rate Limits">
        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-400">
            Each API key is rate limited to prevent abuse:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500">Per minute</p>
              <p className="text-lg font-bold text-white">60</p>
              <p className="text-[10px] text-gray-600">requests</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500">Per hour</p>
              <p className="text-lg font-bold text-white">1,000</p>
              <p className="text-[10px] text-gray-600">requests</p>
            </div>
          </div>
          <CodeBlock
            id="rate-limit-err"
            code={`// 429 — Rate limit exceeded
{
  "success": false,
  "message": "Rate limit exceeded (60 per minute). Retry in 45s.",
  "error": { "code": "TOO_MANY_REQUESTS", "details": null }
}`}
          />
          <p className="text-xs text-gray-500">
            Configure limits via{" "}
            <code className="text-brand-400">RATE_LIMIT_PER_MINUTE</code> and{" "}
            <code className="text-brand-400">RATE_LIMIT_PER_HOUR</code> env
            vars.
          </p>
        </div>
      </Section>

      {/* ── IP Whitelist ── */}
      <Section title="🛡️ IP Whitelist">
        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-400">
            Restrict an API key to specific IP addresses or CIDR ranges. Manage
            from{" "}
            <a href="/api-keys" className="text-brand-400 hover:underline">
              API Keys
            </a>{" "}
            → expand a key → IP Whitelist panel.
          </p>
          <CodeBlock
            id="ip-ex"
            code={`// Examples of valid CIDR rules:
"192.168.1.100/32"   // single IP
"10.0.0.0/8"         // private network
"203.0.113.0/24"     // subnet

// If no rules are set → all IPs allowed
// If any rule exists → only matching IPs allowed`}
          />
          <CodeBlock
            id="ip-err"
            code={`// 403 — IP not whitelisted
{
  "success": false,
  "message": "IP address not whitelisted",
  "error": { "code": "FORBIDDEN", "details": null }
}`}
          />
        </div>
      </Section>

      {/* ── Error Reference ── */}
      <Section title="❌ Error Reference">
        <div className="divide-y divide-gray-800">
          {[
            {
              code: 400,
              name: "BAD_REQUEST",
              desc: "Invalid input, session not active, or missing required fields",
            },
            {
              code: 401,
              name: "UNAUTHORIZED",
              desc: "Missing or invalid API key",
            },
            {
              code: 403,
              name: "FORBIDDEN",
              desc: "IP address not in whitelist",
            },
            {
              code: 404,
              name: "NOT_FOUND",
              desc: "Session or resource not found",
            },
            {
              code: 429,
              name: "TOO_MANY_REQUESTS",
              desc: "Rate limit exceeded — check Retry-After",
            },
            {
              code: 500,
              name: "INTERNAL_ERROR",
              desc: "Unexpected server error",
            },
          ].map((e) => (
            <div key={e.code} className="flex items-center gap-4 px-5 py-3">
              <span
                className={`text-xs font-bold font-mono w-8 ${e.code < 500 ? "text-yellow-400" : "text-red-400"}`}
              >
                {e.code}
              </span>
              <code className="text-xs text-brand-400 font-mono w-40 shrink-0">
                {e.name}
              </code>
              <p className="text-xs text-gray-400">{e.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Response envelope ── */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">
          Standard Response Envelope
        </h2>
        <p className="text-xs text-gray-400">
          All endpoints return the same structure:
        </p>
        <CodeBlock
          id="envelope"
          code={`{
  "success": true | false,
  "message": "Human readable message",
  "data": { ... } | null,
  "error": { "code": "ERROR_CODE", "details": ... } | null,
  "timestamp": "2026-04-11T14:00:00.000Z"
}`}
        />
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
            "Phone number format: country code + number, no + or spaces (e.g. 628123456789).",
            "API keys are hashed — we cannot recover a lost key. Revoke and create a new one if lost.",
            "For broadcast, use a delay of at least 2000ms to avoid WhatsApp rate limiting.",
            "Sandbox mode is safe for testing — no messages are actually sent.",
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
