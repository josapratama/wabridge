import {
  BarChart2,
  Layers,
  MessageSquare,
  Radio,
  Bot,
  Clock,
  FileText,
  Users,
  Webhook,
  Key,
  Shield,
  Download,
  Activity,
  Users2,
  Globe,
  Lock,
} from "lucide-react";

const dashboardFeatures = [
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
  { icon: Users2, label: "Team & Roles" },
  { icon: Globe, label: "Multi-provider" },
  { icon: Lock, label: "JWT Auth" },
];

export default function LandingDashboard() {
  return (
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
          {dashboardFeatures.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 hover:border-gray-700 transition-colors"
            >
              <item.icon className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span className="text-xs text-gray-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
