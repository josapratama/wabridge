import {
  MessageSquare,
  Radio,
  Webhook,
  Bot,
  Clock,
  FileText,
  Users,
  BarChart2,
  Key,
  Shield,
  Activity,
  Users2,
  Sparkles,
  RefreshCw,
  Inbox,
  Send,
} from "lucide-react";

const features = [
  {
    icon: Inbox,
    title: "Live Chat Inbox",
    desc: "Real-time bidirectional chat with customers. Supports text, image, audio, video, document, and live read status.",
    color: "text-brand-400 bg-brand-500/10",
  },
  {
    icon: Radio,
    title: "Anti-Ban Broadcast",
    desc: "Send to thousands with Spintax {Halo|Hai}, recipient variables {{name}}, and randomized jitter delay to keep numbers safe.",
    color: "text-purple-400 bg-purple-500/10",
  },
  {
    icon: Bot,
    title: "AI Bot & Human Handover",
    desc: "AI chatbot trained on your knowledge base. Seamlessly escalates to human agents when customer requests '#agent'.",
    color: "text-yellow-400 bg-yellow-500/10",
  },
  {
    icon: RefreshCw,
    title: "WhatsApp Contact Sync",
    desc: "Sync all contacts directly from connected WhatsApp phonebooks with 1-click, complete with tag grouping.",
    color: "text-emerald-400 bg-emerald-500/10",
  },
  {
    icon: Webhook,
    title: "Webhooks with Test Ping",
    desc: "Real-time outbound webhooks for received, delivered, and read events with built-in live Test Ping and HMAC verification.",
    color: "text-blue-400 bg-blue-500/10",
  },
  {
    icon: Key,
    title: "Developer REST v1 API",
    desc: "Full developer API with API Keys, IP whitelisting, rate limiting, /v1/messages, /v1/sessions, and Sandbox mode.",
    color: "text-indigo-400 bg-indigo-500/10",
  },
  {
    icon: Activity,
    title: "Multi-Session Baileys Map",
    desc: "Run multiple WhatsApp accounts simultaneously in a single server instance with zero connection collision.",
    color: "text-teal-400 bg-teal-500/10",
  },
  {
    icon: Clock,
    title: "Scheduled Messages",
    desc: "Schedule messages to be sent at a specific date and time. Cancel or edit anytime before delivery.",
    color: "text-orange-400 bg-orange-500/10",
  },
  {
    icon: FileText,
    title: "Message Templates",
    desc: "Reusable templates with {{variable}} placeholders. Render with dynamic values via dashboard or API.",
    color: "text-cyan-400 bg-cyan-500/10",
  },
  {
    icon: Shield,
    title: "Security & IP Whitelist",
    desc: "Secure SHA-256 hashed keys with CIDR/IP whitelisting and sliding-window rate limiting per API key.",
    color: "text-red-400 bg-red-500/10",
  },
  {
    icon: BarChart2,
    title: "Analytics & Health",
    desc: "Track messages per day, success rates, delivery speed, and live Baileys / Meta session health status.",
    color: "text-pink-400 bg-pink-500/10",
  },
  {
    icon: Users2,
    title: "Team Access Control",
    desc: "Invite team members with role-based access control: Administrator, Support Operator, or Viewer.",
    color: "text-violet-400 bg-violet-500/10",
  },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-14">
        <h2 className="text-3xl font-bold text-white mb-3">
          Everything you need
        </h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          A full-featured platform built for developers and businesses who need
          reliable WhatsApp automation.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 hover:border-gray-700 transition-colors group"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${f.color}`}
            >
              <f.icon className="w-4 h-4" />
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
  );
}
