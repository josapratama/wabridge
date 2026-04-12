import { Link } from "react-router-dom";
import { ArrowRight, Zap, Shield, Globe, Code2 } from "lucide-react";
import { CodeBlock, Note, H2, H3, P } from "../shared";

const BASE = "https://your-domain.com";

export default function Introduction() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Introduction</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          WA Integration is a self-hosted WhatsApp API platform that lets you
          send and receive WhatsApp messages from any application via a simple
          REST API.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            icon: Zap,
            label: "Simple REST API",
            desc: "One endpoint to send any message type",
          },
          {
            icon: Shield,
            label: "Secure",
            desc: "API keys with IP whitelist & rate limits",
          },
          {
            icon: Globe,
            label: "Multi-provider",
            desc: "Baileys, Meta Cloud, BSP",
          },
          {
            icon: Code2,
            label: "Self-hosted",
            desc: "Full control, no vendor lock-in",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-1.5"
          >
            <item.icon className="w-4 h-4 text-brand-400" />
            <p className="text-xs font-semibold text-white">{item.label}</p>
            <p className="text-[11px] text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>

      <H2>Base URL</H2>
      <P>All API requests are made to your self-hosted instance:</P>
      <CodeBlock id="base-url" code={`${BASE}`} />

      <H2>How it works</H2>
      <P>
        The platform acts as a bridge between your application and WhatsApp. You
        manage provider configs and sessions through the dashboard, then use API
        keys to send messages from your code.
      </P>

      <div className="space-y-3 my-4">
        {[
          {
            n: "1",
            title: "Create a Provider Config",
            desc: "Connect to WhatsApp via Baileys (scan QR), Meta Cloud API, or a BSP partner.",
          },
          {
            n: "2",
            title: "Create & Activate a Session",
            desc: "A session is an active WhatsApp connection. Activate it to start the connection.",
          },
          {
            n: "3",
            title: "Generate an API Key",
            desc: "Create an API key from the dashboard. It's shown only once — store it securely.",
          },
          {
            n: "4",
            title: "Send Messages",
            desc: "Call POST /v1/messages/send from your application with your API key and session ID.",
          },
        ].map((s) => (
          <div
            key={s.n}
            className="flex gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl"
          >
            <span className="w-7 h-7 rounded-full bg-brand-600/20 text-brand-400 text-xs font-bold flex items-center justify-center shrink-0">
              {s.n}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{s.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <H2>Supported Providers</H2>
      <div className="space-y-2 my-3">
        {[
          {
            name: "Baileys",
            badge: "Free",
            desc: "WhatsApp Web protocol. Connect any number via QR code or pairing code. No business account needed. Best for personal or small-scale use.",
          },
          {
            name: "Meta Cloud API",
            badge: "Official",
            desc: "Official WhatsApp Business API via Meta. Requires a WhatsApp Business account. Best for high-volume production use.",
          },
          {
            name: "BSP / Partner",
            badge: "Custom",
            desc: "Connect via any Business Solution Provider with a custom base URL and access token.",
          },
        ].map((p) => (
          <div
            key={p.name}
            className="flex gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-900/40 text-brand-400 border border-brand-800/40">
                  {p.badge}
                </span>
              </div>
              <p className="text-xs text-gray-400">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Note type="tip">
        New to the platform?{" "}
        <Link to="/login" className="text-brand-400 hover:underline">
          Create an account
        </Link>{" "}
        and follow the quick start guide to send your first message in minutes.
      </Note>
    </div>
  );
}
