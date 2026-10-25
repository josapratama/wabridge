import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

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

const capabilities = [
  "Multi-session Baileys engine (run multiple numbers simultaneously)",
  "Text, image, document, audio, video, and location messages",
  "Anti-ban broadcast engine with Spintax {A|B} & variable {{name}} replacement",
  "AI Chatbot with custom knowledge base & human handover (#agent)",
  "Direct WhatsApp Contact Sync from device phonebooks",
  "Programmatic session discovery via GET /v1/sessions",
  "Sandbox mode for safe testing without sending real messages",
  "Sliding window rate limiting & CIDR/IP whitelisting per API key",
];

export default function LandingAPI() {
  return (
    <section id="api" className="max-w-6xl mx-auto px-6 py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          <div>
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-widest mb-3">
              Developer-first API
            </p>
            <h2 className="text-3xl font-bold text-white">
              Simple, powerful API
            </h2>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            One endpoint to send any message type. Authenticate with an API key.
            Works with any language or framework — cURL, JavaScript, PHP,
            Python, and more.
          </p>
          <ul className="space-y-2.5">
            {capabilities.map((item) => (
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
              to="/public-docs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium rounded-lg transition-colors"
            >
              View Docs
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {[
            {
              label: "Broadcast to multiple recipients",
              code: broadcastExample,
            },
            {
              label: "Receive inbound messages via webhook",
              code: webhookExample,
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-500 mb-2 font-medium">
                {item.label}
              </p>
              <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
                <code>{item.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
