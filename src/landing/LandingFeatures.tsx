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
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Multi-type Messaging",
    desc: "Send text, images, documents, audio, video, and location via a single unified API.",
    color: "text-brand-400 bg-brand-500/10",
  },
  {
    icon: Radio,
    title: "Broadcast",
    desc: "Send to thousands of contacts at once with configurable delay. Supports contact tags.",
    color: "text-purple-400 bg-purple-500/10",
  },
  {
    icon: Webhook,
    title: "Outbound Webhooks",
    desc: "Real-time notifications to your server when messages are received, sent, or status changes.",
    color: "text-blue-400 bg-blue-500/10",
  },
  {
    icon: Bot,
    title: "Auto-reply Rules",
    desc: "Automatically reply to inbound messages using contains, exact, starts_with, or regex.",
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
    desc: "Reusable templates with {{variable}} placeholders. Render with dynamic values via API.",
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
    desc: "Track messages per day, success rate, status breakdown, and monthly quota usage.",
    color: "text-pink-400 bg-pink-500/10",
  },
  {
    icon: Key,
    title: "API Key Management",
    desc: "Multiple API keys with expiry dates, IP whitelist restrictions, and rate limits.",
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
    desc: "Real-time connection status for all sessions with auto-reconnect on disconnect.",
    color: "text-teal-400 bg-teal-500/10",
  },
  {
    icon: Users2,
    title: "Team Management",
    desc: "Invite team members with role-based access: Admin, Operator, or Viewer.",
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
