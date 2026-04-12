import { Link } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  MessageSquare,
  Shield,
  Globe,
  Code2,
} from "lucide-react";

const scrollTop = () => window.scrollTo({ top: 0, behavior: "instant" });

export default function DocsFooter() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900/30 mt-16">
      {/* CTA Banner */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">
              Ready to start building?
            </h2>
            <p className="text-sm text-gray-400">
              Connect your WhatsApp and send your first message in minutes.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/login"
              onClick={scrollTop}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Links grid */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div>
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
              Getting Started
            </p>
            <div className="space-y-2">
              {[
                "Introduction",
                "Quick Start",
                "Authentication",
                "Sessions",
              ].map((item) => (
                <p
                  key={item}
                  className="text-xs text-gray-400 hover:text-brand-400 cursor-pointer transition-colors"
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
              Messaging
            </p>
            <div className="space-y-2">
              {[
                "Send Message",
                "Media Messages",
                "Broadcast",
                "Sandbox Mode",
              ].map((item) => (
                <p
                  key={item}
                  className="text-xs text-gray-400 hover:text-brand-400 cursor-pointer transition-colors"
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
              Automation
            </p>
            <div className="space-y-2">
              {["Webhooks", "Auto-reply", "Templates", "Contacts"].map(
                (item) => (
                  <p
                    key={item}
                    className="text-xs text-gray-400 hover:text-brand-400 cursor-pointer transition-colors"
                  >
                    {item}
                  </p>
                ),
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
              Reference
            </p>
            <div className="space-y-2">
              {[
                "Rate Limits",
                "Error Reference",
                "API Keys",
                "IP Whitelist",
              ].map((item) => (
                <p
                  key={item}
                  className="text-xs text-gray-400 hover:text-brand-400 cursor-pointer transition-colors"
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mb-10 pb-10 border-b border-gray-800">
          {[
            { icon: MessageSquare, label: "Multi-type Messaging" },
            { icon: Shield, label: "API Key Auth" },
            { icon: Globe, label: "Multi-provider" },
            { icon: Code2, label: "REST API" },
            { icon: Zap, label: "Self-hosted" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-full text-xs text-gray-400"
            >
              <item.icon className="w-3 h-3 text-brand-400" />
              {item.label}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" onClick={scrollTop} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-white">WA Integration</span>
          </Link>
          <p className="text-xs text-gray-600">
            Self-hosted WhatsApp API Platform
          </p>
          <div className="flex items-center gap-5">
            <Link
              to="/"
              onClick={scrollTop}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/pricing"
              onClick={scrollTop}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              onClick={scrollTop}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
