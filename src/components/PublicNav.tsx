import { Link, useLocation } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

const scrollTop = () => window.scrollTo({ top: 0, behavior: "instant" });

export default function PublicNav() {
  const { pathname } = useLocation();
  const { t } = useI18n();

  const links = [
    { to: "/#features", labelKey: "public.features", defaultLabel: "Features", external: true },
    { to: "/#how-it-works", labelKey: "public.how_it_works", defaultLabel: "How it works", external: true },
    { to: "/pricing", labelKey: "public.pricing", defaultLabel: "Pricing", external: false },
    { to: "/public-docs", labelKey: "public.docs", defaultLabel: "Docs", external: false },
  ];

  return (
    <nav className="border-b border-gray-800 sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" onClick={scrollTop} className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">WA Integration</span>
          {pathname === "/public-docs" && (
            <span className="text-xs text-gray-500 ml-1">/ {t("public.docs", "Docs")}</span>
          )}
          {pathname === "/pricing" && (
            <span className="text-xs text-gray-500 ml-1">/ {t("public.pricing", "Pricing")}</span>
          )}
        </Link>

        {/* Links & Switcher */}
        <div className="flex items-center gap-4 sm:gap-5">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.to}
                href={link.to}
                className="text-xs text-gray-400 hover:text-white transition-colors hidden sm:block"
              >
                {t(link.labelKey, link.defaultLabel)}
              </a>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                onClick={scrollTop}
                className={`text-xs transition-colors hidden sm:block ${
                  pathname === link.to
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t(link.labelKey, link.defaultLabel)}
              </Link>
            ),
          )}

          <LanguageSwitcher compact />

          <Link
            to="/login"
            onClick={scrollTop}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <span>{t("public.get_started", "Get Started")}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
