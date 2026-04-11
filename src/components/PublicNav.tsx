import { Link, useLocation } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";

const links = [
  { to: "/#features", label: "Features", external: true },
  { to: "/#how-it-works", label: "How it works", external: true },
  { to: "/pricing", label: "Pricing", external: false },
  { to: "/public-docs", label: "Docs", external: false },
];

export default function PublicNav() {
  const { pathname } = useLocation();

  return (
    <nav className="border-b border-gray-800 sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">WA Integration</span>
          {pathname === "/public-docs" && (
            <span className="text-xs text-gray-500 ml-1">/ Docs</span>
          )}
          {pathname === "/pricing" && (
            <span className="text-xs text-gray-500 ml-1">/ Pricing</span>
          )}
        </Link>

        {/* Links */}
        <div className="flex items-center gap-5">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.to}
                href={link.to}
                className="text-xs text-gray-400 hover:text-white transition-colors hidden sm:block"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                className={`text-xs transition-colors hidden sm:block ${
                  pathname === link.to
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ),
          )}
          <Link
            to="/login"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Get Started <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
