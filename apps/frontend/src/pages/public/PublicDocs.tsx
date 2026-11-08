import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, BookOpen, ChevronDown, Check, Menu, X } from "lucide-react";
import PublicNav from "../../components/PublicNav";
import PublicFooter from "../../components/PublicFooter";
import { useI18n } from "../../context/I18nContext";

// Sections
import Introduction from "../../docs/sections/Introduction";
import Quickstart from "../../docs/sections/Quickstart";
import Authentication from "../../docs/sections/Authentication";
import SessionsDocs from "../../docs/sections/Sessions";
import SendMessage from "../../docs/sections/SendMessage";
import MediaMessages from "../../docs/sections/MediaMessages";
import BroadcastDocs from "../../docs/sections/BroadcastDocs";
import SandboxMode from "../../docs/sections/SandboxMode";
import WebhooksDocs from "../../docs/sections/Webhooks";
import AutoReplyDocs from "../../docs/sections/AutoReplyDocs";
import TemplatesDocs from "../../docs/sections/Templates";
import ContactsDocs from "../../docs/sections/ContactsDocs";
import RateLimits from "../../docs/sections/RateLimits";
import ErrorReference from "../../docs/sections/ErrorReference";

const navGroups = [
  {
    label: "Getting Started",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "quickstart", label: "Quick Start" },
      { id: "authentication", label: "Authentication" },
      { id: "sessions", label: "Sessions" },
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
      { id: "contacts", label: "Contacts" },
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
  quickstart: <Quickstart />,
  authentication: <Authentication />,
  sessions: <SessionsDocs />,
  "send-message": <SendMessage />,
  "media-messages": <MediaMessages />,
  broadcast: <BroadcastDocs />,
  sandbox: <SandboxMode />,
  webhooks: <WebhooksDocs />,
  "auto-reply": <AutoReplyDocs />,
  templates: <TemplatesDocs />,
  contacts: <ContactsDocs />,
  "rate-limits": <RateLimits />,
  errors: <ErrorReference />,
};

const allItems = navGroups.flatMap((g) => g.items);

export default function PublicDocs() {
  const { t } = useI18n();
  const [active, setActive] = useState("introduction");
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filtered = search.trim()
    ? allItems.filter((i) =>
        i.label.toLowerCase().includes(search.toLowerCase()),
      )
    : null;

  const navigate = (id: string) => {
    setActive(id);
    setSearch("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const currentIndex = allItems.findIndex((i) => i.id === active);
  const prev = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const next =
    currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("docs-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <PublicNav />

      <div className="flex-1 flex max-w-6xl mx-auto w-full px-4 sm:px-6 gap-0">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 hidden lg:flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] border-r border-gray-800">
          {/* Search */}
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                id="docs-search"
                type="text"
                placeholder="Search docs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-8 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-600 bg-gray-700 px-1 rounded">
                /
              </kbd>
            </div>
            {/* Search results */}
            {filtered && (
              <div className="mt-2 space-y-0.5">
                {filtered.length === 0 ? (
                  <p className="text-xs text-gray-600 px-2 py-1">No results</p>
                ) : (
                  filtered.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className="w-full text-left px-2 py-1.5 rounded text-xs text-gray-300 hover:bg-gray-800 hover:text-brand-400 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5 px-2">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
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
          <div className="p-4 border-t border-gray-800">
            <div className="p-3 bg-brand-900/20 border border-brand-800/30 rounded-xl space-y-2">
              <p className="text-xs font-medium text-brand-300">
                Ready to build?
              </p>
              <p className="text-[10px] text-gray-500">
                Get your API key and start sending in minutes.
              </p>
              <Link
                to="/login"
                onClick={() => window.scrollTo(0, 0)}
                className="block text-center text-xs bg-brand-600 hover:bg-brand-500 text-white py-1.5 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 py-8 lg:pl-10">
          {/* Mobile nav */}
          <div className="lg:hidden mb-6 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder={t("common.search", "Search docs...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="px-3 py-2 bg-gray-900 border border-gray-800 hover:border-brand-500/50 rounded-xl text-xs font-medium text-gray-200 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-brand-400" />
                <span className="truncate max-w-[130px] sm:max-w-none">
                  {allItems.find((i) => i.id === active)?.label}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                    mobileMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Mobile search results */}
            {filtered && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800/60 overflow-hidden shadow-lg">
                {filtered.length === 0 ? (
                  <p className="text-xs text-gray-500 p-3 text-center">
                    {t("common.empty", "No results found")}
                  </p>
                ) : (
                  filtered.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-brand-400 flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      {active === item.id && (
                        <Check className="w-3.5 h-3.5 text-brand-400" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Mobile chapter picker drawer */}
            {mobileMenuOpen && !filtered && (
              <div className="bg-gray-900/95 border border-gray-800 rounded-2xl p-3.5 space-y-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                {navGroups.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            active === item.id
                              ? "bg-brand-600/20 text-brand-300 font-semibold"
                              : "text-gray-400 hover:text-white hover:bg-gray-800"
                          }`}
                        >
                          <span>{item.label}</span>
                          {active === item.id && (
                            <Check className="w-3 h-3 text-brand-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-6">
            <span>Docs</span>
            <span>/</span>
            <span className="text-gray-400">
              {allItems.find((i) => i.id === active)?.label}
            </span>
          </div>

          {/* Section content */}
          <div className="max-w-2xl">{sectionMap[active]}</div>

          {/* Prev / Next */}
          <div className="max-w-2xl mt-12 pt-6 border-t border-gray-800 grid grid-cols-2 gap-4">
            {prev ? (
              <button
                onClick={() => navigate(prev.id)}
                className="flex flex-col gap-1 p-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl text-left transition-colors group"
              >
                <span className="text-[10px] text-gray-600 uppercase tracking-wide">
                  Previous
                </span>
                <span className="text-xs text-gray-300 group-hover:text-brand-400 transition-colors">
                  ← {prev.label}
                </span>
              </button>
            ) : (
              <div />
            )}
            {next ? (
              <button
                onClick={() => navigate(next.id)}
                className="flex flex-col gap-1 p-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl text-right ml-auto w-full transition-colors group"
              >
                <span className="text-[10px] text-gray-600 uppercase tracking-wide">
                  Next
                </span>
                <span className="text-xs text-gray-300 group-hover:text-brand-400 transition-colors">
                  {next.label} →
                </span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => window.scrollTo(0, 0)}
                className="flex flex-col gap-1 p-4 bg-brand-900/20 border border-brand-800/40 hover:border-brand-700 rounded-xl text-right ml-auto w-full transition-colors group"
              >
                <span className="text-[10px] text-brand-600 uppercase tracking-wide">
                  You're all set!
                </span>
                <span className="text-xs text-brand-400 group-hover:text-brand-300 transition-colors flex items-center justify-end gap-1">
                  Get started <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            )}
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}
