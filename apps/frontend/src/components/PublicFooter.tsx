import { Link } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  MessageSquare,
  Shield,
  Globe,
  Code2,
} from "lucide-react";
import { useI18n } from "../context/I18nContext";

const scrollTop = () => window.scrollTo({ top: 0, behavior: "instant" });

export default function PublicFooter() {
  const { t } = useI18n();

  const footerLinks = {
    [t("footer.product")]: [
      { label: t("public.features"), href: "/#features" },
      { label: t("public.how_it_works"), href: "/#how-it-works" },
      { label: t("public.pricing"), to: "/pricing" },
      { label: t("nav.overview"), to: "/login" },
    ],
    [t("footer.developers")]: [
      { label: t("public.docs"), to: "/public-docs" },
      { label: "Quick Start", to: "/public-docs" },
      { label: "API Reference", to: "/public-docs" },
      { label: "Webhooks", to: "/public-docs" },
    ],
    [t("footer.platform")]: [
      { label: "Baileys (Free)", to: "/public-docs" },
      { label: "Meta Cloud API", to: "/public-docs" },
      { label: "BSP / Partner", to: "/public-docs" },
      { label: "Self-hosted", to: "/public-docs" },
    ],
  };

  const stats = [
    { value: "3", label: t("footer.providers_count") },
    { value: "14+", label: t("footer.features_count") },
    { value: "3", label: t("footer.languages_count") },
    { value: "∞", label: t("footer.messages_count") },
  ];

  return (
    <footer className="border-t border-gray-800">
      {/* Stats */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              to="/"
              onClick={scrollTop}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white">
                WA Integration
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: MessageSquare, label: "Messaging" },
                { icon: Shield, label: "Secure" },
                { icon: Globe, label: "Multi-provider" },
                { icon: Code2, label: "REST API" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 border border-gray-800 rounded-full text-[10px] text-gray-400"
                >
                  <item.icon className="w-3 h-3 text-brand-400" />
                  {item.label}
                </div>
              ))}
            </div>
            <Link
              to="/login"
              onClick={scrollTop}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {t("public.get_started")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-4">
                {group}
              </p>
              <div className="space-y-2.5">
                {links.map((link) =>
                  "to" in link ? (
                    <Link
                      key={link.label}
                      to={link.to!}
                      onClick={scrollTop}
                      className="block text-xs text-gray-400 hover:text-brand-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      className="block text-xs text-gray-400 hover:text-brand-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-brand-600 flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-xs text-gray-600">
              WA Integration — {t("footer.all_rights")}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>Built with</span>
            <span className="text-red-500">♥</span>
            <span>for developers</span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              to="/pricing"
              onClick={scrollTop}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              {t("public.pricing")}
            </Link>
            <Link
              to="/public-docs"
              onClick={scrollTop}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              {t("public.docs")}
            </Link>
            <Link
              to="/login"
              onClick={scrollTop}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              {t("public.sign_in")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
