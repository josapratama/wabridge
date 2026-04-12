import { Link } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import {
  Zap,
  MessageSquare,
  Radio,
  Clock,
  Bot,
  Webhook,
  FileText,
  Key,
  BarChart2,
  Users,
  Shield,
  Globe,
  ArrowRight,
  Check,
  Code2,
  Activity,
  Lock,
  Download,
  Layers,
} from "lucide-react";

function CodeSnippet({ code }: { code: string }) {
  return (
    <pre className="bg-gray-950 border border-gray-800 rounded-xl p-5 text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
      <code>{code}</code>
    </pre>
  );
}

const sendExample = `curl -X POST https://your-domain.com/v1/messages/send \\
  -H "X-API-Key: wai_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "sess_abc123",
    "to": "628123456789",
    "message": "Hello from WA Integration! 👋"
  }'`;

const broadcastExample = `// Send to 1000 contacts with 2s delay
POST /v1/messages/broadcast
{
  "session_id": "sess_abc123",
  "recipients": ["628111", "628222", "628333"],
  "message": "🎉 Special offer just for you!",
  "delay_ms": 2000
}`;

const webhookExample = `// Your server receives this when a message arrives
POST https://your-app.com/webhook
{
  "event": "message.received",
  "data": {
    "from": "628123456789",
    "content": "Hi, I need help!",
    "sessionId": "sess_abc123"
  }
}`;

const features = [
  {
    icon: MessageSquare,
    title: "Multi-type Messaging",
    desc: "Send text, images, documents, audio, video, and location messages via a single unified API.",
    color: "text-brand-400 bg-brand-500/10",
  },
  {
    icon: Radio,
    title: "Broadcast",
    desc: "Send to thousands of contacts at once with configurable delay to avoid bans. Supports contact tags.",
    color: "text-purple-400 bg-purple-500/10",
  },
  {
    icon: Webhook,
    title: "Outbound Webhooks",
    desc: "Get real-time notifications to your server when messages are received, sent, or status changes.",
    color: "text-blue-400 bg-blue-500/10",
  },
  {
    icon: Bot,
    title: "Auto-reply Rules",
    desc: "Automatically reply to inbound messages using contains, exact, starts_with, or regex matching.",
    color: "text-yellow-400 bg-yellow-500/10",
  },
  {
    icon: Clock,
    title: "Scheduled Messages",
    desc: "Schedule messages to be sent at a specific date and time. Cancel anytime before delivery.",
    color: "text-orange-400 bg-orange-500/10",
  },
  {
    icon: FileText,
    title: "Message Templates",
    desc: "Create reusable templates with {{variable}} placeholders. Render with dynamic values via API.",
    color: "text-cyan-400 bg-cyan-500/10",
  },
  {
    icon: Users,
    title: "Contact Management",
    desc: "Store contacts with tags and notes. Use tag-based filtering for targeted broadcasts.",
    color: "text-green-400 bg-green-500/10",
  },
  {
    icon: BarChart2,
    title: "Analytics",
    desc: "Track messages sent/received per day, success rate, status breakdown, and monthly quota usage.",
    color: "text-pink-400 bg-pink-500/10",
  },
  {
    icon: Key,
    title: "API Key Management",
    desc: "Create multiple API keys with expiry dates, IP whitelist restrictions, and per-minute/hour rate limits.",
    color: "text-indigo-400 bg-indigo-500/10",
  },
  {
    icon: Shield,
    title: "IP Whitelist",
    desc: "Restrict each API key to specific IP addresses or CIDR ranges for maximum security.",
    color: "text-red-400 bg-red-500/10",
  },
  {
    icon: Activity,
    title: "Session Health Monitor",
    desc: "Real-time connection status for all WhatsApp sessions with auto-reconnect on disconnect.",
    color: "text-teal-400 bg-teal-500/10",
  },
  {
    icon: Users,
    title: "Team Management",
    desc: "Invite team members with role-based access: Admin, Operator, or Viewer.",
    color: "text-violet-400 bg-violet-500/10",
  },
];

const providers = [
  {
    name: "Baileys",
    desc: "WhatsApp Web — connect any number via QR or pairing code. No business account needed.",
    badge: "Free",
  },
  {
    name: "Meta Cloud API",
    desc: "Official WhatsApp Business API via Meta. Best for high-volume production use.",
    badge: "Official",
  },
  {
    name: "BSP / Partner",
    desc: "Connect via any Business Solution Provider with a custom base URL.",
    badge: "Custom",
  },
];

const steps = [
  {
    n: "01",
    title: "Create a Provider Config",
    desc: "Choose Baileys, Meta Cloud, or BSP. For Baileys, scan a QR code to connect your number.",
  },
  {
    n: "02",
    title: "Create & Activate a Session",
    desc: "Link your provider config to a session. Activate it to establish the WhatsApp connection.",
  },
  {
    n: "03",
    title: "Generate an API Key",
    desc: "Create an API key from the dashboard. Copy it once — it's hashed and never shown again.",
  },
  {
    n: "04",
    title: "Send Messages",
    desc: "Call POST /v1/messages/send from your app with your API key and session ID.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-900/40 border border-brand-800/50 rounded-full text-xs text-brand-400 mb-8">
          <Zap className="w-3 h-3" />
          Multi-provider WhatsApp API Platform
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
          Send WhatsApp messages
          <br />
          <span className="text-brand-400">from any application</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          A complete self-hosted WhatsApp integration platform. Connect via
          Baileys, Meta Cloud API, or BSP. Manage sessions, broadcast to
          thousands, automate replies — all through a simple REST API.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Start for free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/public-docs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-xl transition-colors text-sm"
          >
            <Code2 className="w-4 h-4" /> View API Docs
          </Link>
        </div>

        {/* Code preview */}
        <div className="mt-16 max-w-2xl mx-auto text-left">
          <CodeSnippet code={sendExample} />
        </div>
      </section>

      {/* Providers */}
      <section className="border-y border-gray-800 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-center text-xs text-gray-500 uppercase tracking-widest mb-8">
            Supported Providers
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {providers.map((p) => (
              <div
                key={p.name}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{p.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-900/40 text-brand-400 border border-brand-800/40 font-medium">
                    {p.badge}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">
            Everything you need
          </h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            A full-featured platform built for developers and businesses who
            need reliable WhatsApp automation.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 hover:border-gray-700 transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${f.color}`}
              >
                <f.icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-y border-gray-800 bg-gray-900/30"
      >
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">
              Get started in minutes
            </h2>
            <p className="text-gray-400 text-sm">
              No complex setup. Self-host and start sending in 4 steps.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gray-800 -translate-x-3 z-0" />
                )}
                <div className="relative z-10 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-600/15 border border-brand-800/40 flex items-center justify-center">
                    <span className="text-brand-400 font-bold text-sm">
                      {s.n}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API section */}
      <section id="api" className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">
              Simple, powerful API
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              One endpoint to send any message type. Authenticate with an API
              key. Works with any language or framework.
            </p>
            <ul className="space-y-3">
              {[
                "Text, image, document, audio, video, location",
                "Broadcast to 1000+ recipients with delay",
                "Sandbox mode for safe testing",
                "Rate limiting: 60 req/min, 1000 req/hour",
                "IP whitelist per API key",
                "Standard JSON response envelope",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-xs text-gray-300"
                >
                  <Check className="w-4 h-4 text-brand-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Get API Key <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium rounded-lg transition-colors"
              >
                View Docs
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">
                Broadcast to multiple recipients
              </p>
              <CodeSnippet code={broadcastExample} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">
                Receive inbound messages via webhook
              </p>
              <CodeSnippet code={webhookExample} />
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard preview features */}
      <section className="border-y border-gray-800 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">
              Full-featured dashboard
            </h2>
            <p className="text-gray-400 text-sm">
              Manage everything from a clean, dark-mode web interface.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { icon: BarChart2, label: "Analytics & Usage" },
              { icon: Layers, label: "Session Management" },
              { icon: MessageSquare, label: "Message History" },
              { icon: Radio, label: "Broadcast Jobs" },
              { icon: Bot, label: "Auto-reply Rules" },
              { icon: Clock, label: "Scheduled Messages" },
              { icon: FileText, label: "Message Templates" },
              { icon: Users, label: "Contact Book" },
              { icon: Webhook, label: "Webhook Logs" },
              { icon: Key, label: "API Key Manager" },
              { icon: Shield, label: "IP Whitelist" },
              { icon: Download, label: "Export CSV / JSON" },
              { icon: Activity, label: "Session Health" },
              { icon: Users, label: "Team & Roles" },
              { icon: Globe, label: "Multi-provider" },
              { icon: Lock, label: "JWT Auth" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5"
              >
                <item.icon className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span className="text-xs text-gray-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="bg-gradient-to-br from-brand-900/40 to-gray-900 border border-brand-800/30 rounded-2xl p-12 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Self-host in minutes. Connect your WhatsApp number and start sending
            messages from your application today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Create free account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-xl transition-colors text-sm"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-gray-500">
              WA Integration — Self-hosted WhatsApp API Platform
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/login"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/login"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
