import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PublicNav from "../components/PublicNav";

// Sections
import Introduction from "../docs/sections/Introduction";
import Authentication from "../docs/sections/Authentication";
import SendMessage from "../docs/sections/SendMessage";
import MediaMessages from "../docs/sections/MediaMessages";
import BroadcastDocs from "../docs/sections/BroadcastDocs";
import WebhooksDocs from "../docs/sections/Webhooks";
import AutoReplyDocs from "../docs/sections/AutoReplyDocs";
import TemplatesDocs from "../docs/sections/Templates";
import SandboxMode from "../docs/sections/SandboxMode";
import RateLimits from "../docs/sections/RateLimits";
import ErrorReference from "../docs/sections/ErrorReference";

const navGroups = [
  {
    label: "Getting Started",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "authentication", label: "Authentication" },
    ],
  },
  {
    label: "Messaging",
    items: [
      { id: "send-message", label: "Send Message" },
      { id: "media-messages", label: "Media Messages" },
      { id: "broadcast", label: "Broadcast" },
      { id: "sandbox", label: "Sandbox Mode" },
    ],
  },
  {
    label: "Automation",
    items: [
      { id: "webhooks", label: "Webhooks" },
      { id: "auto-reply", label: "Auto-reply" },
      { id: "templates", label: "Message Templates" },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "rate-limits", label: "Rate Limits" },
      { id: "errors", label: "Error Reference" },
    ],
  },
];

const sectionMap: Record<string, React.ReactNode> = {
  introduction: <Introduction />,
  authentication: <Authentication />,
  "send-message": <SendMessage />,
  "media-messages": <MediaMessages />,
  broadcast: <BroadcastDocs />,
  sandbox: <SandboxMode />,
  webhooks: <WebhooksDocs />,
  "auto-reply": <AutoReplyDocs />,
  templates: <TemplatesDocs />,
  "rate-limits": <RateLimits />,
  errors: <ErrorReference />,
};

export default function PublicDocs() {
  const [active, setActive] = useState("introduction");

  const allItems = navGroups.flatMap((g) => g.items);
  const currentIndex = allItems.findIndex((i) => i.id === active);
  const prev = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const next =
    currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <PublicNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-0">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-4 border-r border-gray-800">
          <nav className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2 px-3">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActive(item.id);
                        window.scrollTo(0, 0);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        active === item.id
                          ? "bg-brand-600/20 text-brand-400 font-medium"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* CTA */}
          <div className="mt-8 p-3 bg-brand-900/20 border border-brand-800/30 rounded-xl space-y-2">
            <p className="text-xs font-medium text-brand-300">
              Ready to build?
            </p>
            <p className="text-[10px] text-gray-500">
              Get your API key and start sending in minutes.
            </p>
            <Link
              to="/login"
              className="block text-center text-xs bg-brand-600 hover:bg-brand-500 text-white py-1.5 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 py-8 lg:pl-10">
          {/* Mobile nav */}
          <div className="lg:hidden mb-6">
            <select
              value={active}
              onChange={(e) => setActive(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
            >
              {navGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Section content */}
          <div className="max-w-2xl">{sectionMap[active]}</div>

          {/* Prev / Next navigation */}
          <div className="max-w-2xl mt-12 pt-6 border-t border-gray-800 flex items-center justify-between gap-4">
            {prev ? (
              <button
                onClick={() => {
                  setActive(prev.id);
                  window.scrollTo(0, 0);
                }}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-brand-400 transition-colors"
              >
                ← {prev.label}
              </button>
            ) : (
              <div />
            )}
            {next ? (
              <button
                onClick={() => {
                  setActive(next.id);
                  window.scrollTo(0, 0);
                }}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-brand-400 transition-colors ml-auto"
              >
                {next.label} →
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors ml-auto"
              >
                Get started <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
