import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  Copy,
  Check,
  BookOpen,
  Send,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Code2,
} from "lucide-react";

const BASE = "https://your-domain.com";

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

function Section({
  id,
  title,
  children,
  defaultOpen = false,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      id={id}
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
    >
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
      {open && (
        <div className="border-t border-gray-800 p-5 space-y-4">{children}</div>
      )}
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
    <div className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
      <div className="w-32 shrink-0">
        <code className="text-xs text-brand-400 font-mono">{name}</code>
        {required && <span className="ml-1 text-[10px] text-red-400">*</span>}
      </div>
      <div className="w-14 shrink-0 text-[10px] text-gray-600 font-mono">
        {type}
      </div>
      <p className="text-xs text-gray-400 flex-1">{desc}</p>
    </div>
  );
}

function Badge({ method }: { method: string }) {
  const c: Record<string, string> = {
    POST: "bg-brand-500/15 text-brand-400 border-brand-800/50",
    GET: "bg-blue-500/15 text-blue-400 border-blue-800/50",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${c[method] ?? ""}`}
    >
      {method}
    </span>
  );
}

const navItems = [
  { href: "#quickstart", label: "Quick Start" },
  { href: "#authentication", label: "Authentication" },
  { href: "#send-message", label: "Send Message" },
  { href: "#broadcast", label: "Broadcast" },
  { href: "#media", label: "Media Types" },
  { href: "#sandbox", label: "Sandbox" },
  { href: "#rate-limits", label: "Rate Limits" },
  { href: "#errors", label: "Errors" },
];

export default function PublicDocs() {
  const [lang, setLang] = useState<"curl" | "js" | "php" | "python">("curl");

  const sendSnippets = {
    curl: `curl -X POST ${BASE}/v1/messages/send \\
  -H "X-API-Key: wai_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "sess_abc123",
    "to": "628123456789",
    "message": "Hello! 👋"
  }'`,
    js: `const res = await fetch("${BASE}/v1/messages/send", {
  method: "POST",
  headers: {
    "X-API-Key": "wai_live_YOUR_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    session_id: "sess_abc123",
    to: "628123456789",
    message: "Hello! 👋",
  }),
});
const data = await res.json();
console.log(data.data.message_id);`,
    php: `<?php
$ch = curl_init("${BASE}/v1/messages/send");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "X-API-Key: wai_live_YOUR_KEY",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "session_id" => "sess_abc123",
    "to"         => "628123456789",
    "message"    => "Hello! 👋",
  ]),
]);
$data = json_decode(curl_exec($ch), true);`,
    python: `import requests

res = requests.post(
    "${BASE}/v1/messages/send",
    headers={"X-API-Key": "wai_live_YOUR_KEY"},
    json={
        "session_id": "sess_abc123",
        "to": "628123456789",
        "message": "Hello! 👋",
    },
)
print(res.json()["data"]["message_id"])`,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navbar */}
      <nav className="border-b border-gray-800 sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">WA Integration</span>
            <span className="text-xs text-gray-500 ml-1">/ Docs</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/pricing"
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Get Started <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 flex gap-8">
        {/* Sidebar nav */}
        <aside className="w-48 shrink-0 hidden lg:block sticky top-24 self-start">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
            On this page
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block text-xs text-gray-400 hover:text-brand-400 py-1 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-8 p-3 bg-brand-900/20 border border-brand-800/30 rounded-lg space-y-2">
            <p className="text-xs font-medium text-brand-300">
              Ready to build?
            </p>
            <p className="text-[10px] text-gray-500">
              Create a free account to get your API key.
            </p>
            <Link
              to="/register"
              className="block text-center text-xs bg-brand-600 hover:bg-brand-500 text-white py-1.5 rounded-lg transition-colors"
            >
              Get API Key
            </Link>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 space-y-6 min-w-0">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-brand-400" />
              API Reference
            </h1>
            <p className="text-sm text-gray-400">
              Base URL: <code className="text-brand-400 font-mono">{BASE}</code>
            </p>
          </div>

          {/* Quick Start */}
          <div
            id="quickstart"
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4"
          >
            <h2 className="text-sm font-semibold text-white">🚀 Quick Start</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  n: "1",
                  t: "Register",
                  d: "Create a free account and log in to the dashboard.",
                },
                {
                  n: "2",
                  t: "Connect WhatsApp",
                  d: "Create a provider config and scan the QR code with your phone.",
                },
                {
                  n: "3",
                  t: "Get API Key",
                  d: "Generate an API key from the dashboard and start sending.",
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className="bg-gray-800/50 rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 text-[10px] font-bold flex items-center justify-center">
                      {s.n}
                    </span>
                    <p className="text-xs font-semibold text-white">{s.t}</p>
                  </div>
                  <p className="text-[11px] text-gray-400">{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Authentication */}
          <div
            id="authentication"
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3"
          >
            <h2 className="text-sm font-semibold text-white">
              🔑 Authentication
            </h2>
            <p className="text-xs text-gray-400">
              All API requests require an API key passed in the{" "}
              <code className="text-brand-400">X-API-Key</code> header.
            </p>
            <CodeBlock
              id="auth"
              code={`X-API-Key: wai_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
            />
            <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-3 py-2">
              <p className="text-xs text-yellow-400">
                API keys are shown only once at creation. Store them securely —
                we cannot recover lost keys.
              </p>
            </div>
          </div>

          {/* Send Message */}
          <div
            id="send-message"
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
          >
            <div className="p-5 border-b border-gray-800">
              <div className="flex items-center gap-2 mb-1">
                <Badge method="POST" />
                <code className="text-xs text-gray-300 font-mono">
                  /v1/messages/send
                </code>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Send a WhatsApp message to a single recipient.
              </p>
            </div>
            <div className="p-5 space-y-4">
              {/* Lang tabs */}
              <div className="flex gap-1">
                {(["curl", "js", "php", "python"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${lang === l ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}
                  >
                    {l === "js"
                      ? "JavaScript"
                      : l === "php"
                        ? "PHP"
                        : l === "python"
                          ? "Python"
                          : "cURL"}
                  </button>
                ))}
              </div>
              <CodeBlock code={sendSnippets[lang]} id={`send-${lang}`} />

              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">
                  Request Body
                </p>
                <div className="bg-gray-950 border border-gray-800 rounded-lg px-4 py-1">
                  <Field
                    name="session_id"
                    type="string"
                    required
                    desc="ID of an active session. Get from the Sessions page."
                  />
                  <Field
                    name="to"
                    type="string"
                    required
                    desc="Recipient phone with country code. No + or spaces. e.g. 628123456789"
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
                    desc="text | image | document | audio | video | location (default: text)"
                  />
                  <Field
                    name="media_url"
                    type="string"
                    desc="URL of media file (for image/document/audio/video)"
                  />
                  <Field
                    name="caption"
                    type="string"
                    desc="Caption for image/document/video"
                  />
                  <Field
                    name="latitude"
                    type="number"
                    desc="Latitude (for location type)"
                  />
                  <Field
                    name="longitude"
                    type="number"
                    desc="Longitude (for location type)"
                  />
                  <Field
                    name="sandbox"
                    type="boolean"
                    desc="If true, returns fake success without sending"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">
                  Response
                </p>
                <CodeBlock
                  id="send-res"
                  code={`{
  "success": true,
  "message": "OK",
  "data": {
    "message_id": "msg_abc123",
    "session_id": "sess_abc123",
    "to": "628123456789",
    "status": "sent",
    "sent_at": "2026-04-11T14:00:00.000Z"
  },
  "error": null,
  "timestamp": "2026-04-11T14:00:00.000Z"
}`}
                />
              </div>
            </div>
          </div>

          {/* Broadcast */}
          <Section
            id="broadcast"
            title="📡 POST /v1/messages/broadcast"
            defaultOpen={false}
          >
            <p className="text-xs text-gray-400">
              Send a message to multiple recipients with a configurable delay
              between each send.
            </p>
            <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-3 py-2">
              <p className="text-xs text-yellow-400">
                Max 1000 recipients per request. Use delay_ms ≥ 2000 to avoid
                WhatsApp rate limiting.
              </p>
            </div>
            <CodeBlock
              id="broadcast-req"
              code={`POST /v1/messages/broadcast
{
  "session_id": "sess_abc123",
  "recipients": ["628111111111", "628222222222", "628333333333"],
  "message": "🎉 Special offer just for you!",
  "delay_ms": 2000
}`}
            />
            <CodeBlock
              id="broadcast-res"
              code={`{
  "success": true,
  "data": {
    "job_id": "broadcast_abc123",
    "total": 3,
    "status": "running"
  }
}`}
            />
          </Section>

          {/* Media */}
          <Section id="media" title="🖼️ Media Message Types">
            <p className="text-xs text-gray-400">
              Set <code className="text-brand-400">type</code> to send different
              media formats.
            </p>
            <div className="space-y-3">
              {[
                {
                  type: "image",
                  extra: `"media_url": "https://example.com/photo.jpg",\n  "caption": "Check this out"`,
                },
                {
                  type: "document",
                  extra: `"media_url": "https://example.com/invoice.pdf",\n  "caption": "Invoice #001"`,
                },
                {
                  type: "audio",
                  extra: `"media_url": "https://example.com/voice.mp3"`,
                },
                {
                  type: "video",
                  extra: `"media_url": "https://example.com/clip.mp4",\n  "caption": "Watch this"`,
                },
                {
                  type: "location",
                  extra: `"latitude": -6.2088,\n  "longitude": 106.8456,\n  "locationName": "Jakarta"`,
                },
              ].map((m) => (
                <div key={m.type}>
                  <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                    {m.type}
                  </p>
                  <CodeBlock
                    id={`media-${m.type}`}
                    code={`{\n  "session_id": "sess_abc123",\n  "to": "628123456789",\n  "message": "${m.type} message",\n  "type": "${m.type}",\n  ${m.extra}\n}`}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* Sandbox */}
          <Section id="sandbox" title="🧪 Sandbox Mode">
            <p className="text-xs text-gray-400">
              Add <code className="text-brand-400">"sandbox": true</code> to any
              send request to test without actually sending messages. Perfect
              for development and CI/CD.
            </p>
            <CodeBlock
              id="sandbox"
              code={`{
  "session_id": "sess_abc123",
  "to": "628123456789",
  "message": "Test message",
  "sandbox": true
}

// Response — no message is sent:
{
  "success": true,
  "data": {
    "message_id": "sandbox_1712844000000",
    "status": "sandbox",
    "sandbox": true
  }
}`}
            />
          </Section>

          {/* Rate Limits */}
          <Section id="rate-limits" title="⚡ Rate Limits">
            <p className="text-xs text-gray-400">
              Each API key is rate limited independently.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-lg px-4 py-3 text-center">
                <p className="text-2xl font-bold text-white">60</p>
                <p className="text-xs text-gray-500">requests / minute</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg px-4 py-3 text-center">
                <p className="text-2xl font-bold text-white">1,000</p>
                <p className="text-xs text-gray-500">requests / hour</p>
              </div>
            </div>
            <CodeBlock
              id="rate-err"
              code={`// 429 Too Many Requests
{
  "success": false,
  "message": "Rate limit exceeded (60 per minute). Retry in 45s.",
  "error": { "code": "TOO_MANY_REQUESTS", "details": null }
}`}
            />
          </Section>

          {/* Errors */}
          <Section id="errors" title="❌ Error Reference" defaultOpen={false}>
            <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
              {[
                {
                  code: "400",
                  name: "BAD_REQUEST",
                  desc: "Invalid input or session not active",
                },
                {
                  code: "401",
                  name: "UNAUTHORIZED",
                  desc: "Missing or invalid API key",
                },
                {
                  code: "403",
                  name: "FORBIDDEN",
                  desc: "IP address not in whitelist",
                },
                {
                  code: "404",
                  name: "NOT_FOUND",
                  desc: "Session or resource not found",
                },
                {
                  code: "429",
                  name: "TOO_MANY_REQUESTS",
                  desc: "Rate limit exceeded",
                },
                {
                  code: "500",
                  name: "INTERNAL_ERROR",
                  desc: "Unexpected server error",
                },
              ].map((e, i) => (
                <div
                  key={e.code}
                  className={`flex items-center gap-4 px-4 py-3 ${i < 5 ? "border-b border-gray-800" : ""}`}
                >
                  <span
                    className={`text-xs font-bold font-mono w-8 ${parseInt(e.code) >= 500 ? "text-red-400" : "text-yellow-400"}`}
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
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">
                All errors follow this envelope:
              </p>
              <CodeBlock
                id="err-envelope"
                code={`{
  "success": false,
  "message": "Human readable message",
  "data": null,
  "error": { "code": "ERROR_CODE", "details": null },
  "timestamp": "2026-04-11T14:00:00.000Z"
}`}
              />
            </div>
          </Section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-brand-900/40 to-gray-900 border border-brand-800/30 rounded-xl p-6 text-center space-y-3">
            <p className="text-sm font-semibold text-white">
              Ready to integrate?
            </p>
            <p className="text-xs text-gray-400">
              Create a free account, connect your WhatsApp, and start sending in
              minutes.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
