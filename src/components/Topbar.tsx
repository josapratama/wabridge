import { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  Zap,
  QrCode,
} from "lucide-react";
import { healthApi, HealthResult } from "../api/client";

interface TopbarProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
}

const routeTitles: Record<string, { group: string; title: string }> = {
  "/dashboard": { group: "Overview", title: "Dashboard" },
  "/inbox": { group: "Overview", title: "Live Chat Inbox" },
  "/analytics": { group: "Overview", title: "Analytics" },
  "/provider-configs": { group: "WhatsApp", title: "Provider Configs" },
  "/sessions": { group: "WhatsApp", title: "Sessions" },
  "/groups": { group: "WhatsApp", title: "WhatsApp Groups" },
  "/session-health": { group: "WhatsApp", title: "Session Health" },
  "/messages": { group: "WhatsApp", title: "Messages" },
  "/events": { group: "WhatsApp", title: "Events" },
  "/broadcast": { group: "Messaging", title: "Broadcast" },
  "/scheduled": { group: "Messaging", title: "Scheduled Messages" },
  "/templates": { group: "Messaging", title: "Templates" },
  "/auto-reply": { group: "Messaging", title: "Auto-reply" },
  "/contacts": { group: "Contacts", title: "Contacts" },
  "/webhooks": { group: "Automation", title: "Webhooks" },
  "/team": { group: "Team", title: "Team Members" },
  "/api-keys": { group: "Developer", title: "API Keys" },
};

export default function Topbar({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [showStatusPopover, setShowStatusPopover] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  const currentRoute = routeTitles[location.pathname] || {
    group: "Dashboard",
    title: location.pathname.replace("/", "").replace("-", " ") || "Dashboard",
  };

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await healthApi.check();
      if (res.data) setHealth(res.data);
    } catch (e) {
      console.error("Failed to load health in Topbar", e);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    void fetchHealth();
    const interval = setInterval(() => {
      void fetchHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setShowStatusPopover(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isHealthy = health?.status === "ok";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-800 bg-gray-900/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 bg-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden transition-colors"
        >
          {isMobileSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>{currentRoute.group}</span>
            <span>/</span>
            <span className="text-gray-300 font-medium capitalize">
              {currentRoute.title}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white capitalize leading-tight">
            {currentRoute.title}
          </h1>
        </div>
      </div>

      {/* Right: Health pill, Public docs link, User dropdown */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Live System Health pill with popover */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setShowStatusPopover((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isHealthy
                ? "bg-brand-950/60 border-brand-800/60 text-brand-300 hover:bg-brand-900/50"
                : "bg-yellow-950/60 border-yellow-800/60 text-yellow-300 hover:bg-yellow-900/50"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isHealthy ? "bg-brand-400" : "bg-yellow-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isHealthy ? "bg-brand-500" : "bg-yellow-500"
                }`}
              />
            </span>
            <span className="hidden md:inline">
              {isHealthy ? "All Systems Operational" : "System Degraded"}
            </span>
            <span className="md:hidden">
              {isHealthy ? "Online" : "Degraded"}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {/* Health Popover Details */}
          {showStatusPopover && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-gray-900 border border-gray-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-400" />
                  <span className="text-xs font-semibold text-white">
                    Provider Status
                  </span>
                </div>
                <button
                  onClick={() => void fetchHealth()}
                  disabled={healthLoading}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${healthLoading ? "animate-spin" : ""}`}
                  />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                {health?.providers && health.providers.length > 0 ? (
                  health.providers.map((p) => (
                    <div
                      key={p.providerType}
                      className="flex items-center justify-between text-xs bg-gray-800/40 p-2 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            p.healthy ? "bg-brand-500" : "bg-red-500"
                          }`}
                        />
                        <span className="font-medium text-gray-200 capitalize">
                          {p.providerType}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-semibold ${
                            p.healthy ? "text-brand-400" : "text-red-400"
                          }`}
                        >
                          {p.healthy ? "Online" : "Offline"}
                        </span>
                        {p.message && (
                          <p className="text-[10px] text-gray-500 max-w-[120px] truncate">
                            {p.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">
                    {healthLoading ? "Checking providers..." : "No health data"}
                  </p>
                )}
              </div>

              {health?.providers &&
                health.providers.some(
                  (p) => !p.healthy && p.providerType === "baileys",
                ) && (
                  <Link
                    to="/provider-configs"
                    onClick={() => setShowStatusPopover(false)}
                    className="mt-3 w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan WhatsApp QR Code</span>
                  </Link>
                )}

              {health && (
                <div className="mt-3 pt-2.5 border-t border-gray-800 text-[11px] text-gray-500 flex justify-between">
                  <span>Uptime</span>
                  <span className="font-mono text-gray-300">
                    {Math.floor(health.uptime)}s
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Docs Link */}
        <Link
          to="/public-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-800/80 transition-colors"
          title="Open API Documentation"
        >
          <span>API Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* User Profile Pill & Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserDropdown((prev) => !prev)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full border border-gray-800 bg-gray-850 hover:bg-gray-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300 text-xs font-semibold">
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </div>
            <span className="text-xs font-medium text-gray-200 hidden md:inline max-w-[100px] truncate">
              {user?.name || "Admin"}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-gray-900 border border-gray-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-gray-800">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                  {user?.email || "admin@example.com"}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-950 border border-brand-800 text-[10px] text-brand-300">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{user?.role || "Administrator"}</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/api-keys"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-gray-400" />
                  API Keys & Integrations
                </Link>
                <Link
                  to="/team"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  Team Management
                </Link>
              </div>

              <div className="border-t border-gray-800 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
