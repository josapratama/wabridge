import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings2,
  Layers,
  MessageSquare,
  Activity,
  Zap,
  LogOut,
  User,
  Key,
  Webhook,
  FileText,
  Clock,
  Bot,
  BarChart2,
  Users,
  Radio,
  Users2,
  HeartPulse,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/inbox", icon: MessageSquare, label: "Live Chat" },
      { to: "/analytics", icon: BarChart2, label: "Analytics" },
    ],
  },
  {
    label: "WhatsApp",
    items: [
      { to: "/provider-configs", icon: Settings2, label: "Provider Configs" },
      { to: "/sessions", icon: Layers, label: "Sessions" },
      { to: "/groups", icon: Users, label: "WA Groups" },
      { to: "/session-health", icon: HeartPulse, label: "Session Health" },
      { to: "/messages", icon: MessageSquare, label: "Messages Log" },
      { to: "/events", icon: Activity, label: "Events" },
    ],
  },
  {
    label: "Messaging",
    items: [
      { to: "/broadcast", icon: Radio, label: "Broadcast" },
      { to: "/scheduled", icon: Clock, label: "Scheduled" },
      { to: "/templates", icon: FileText, label: "Templates" },
      { to: "/auto-reply", icon: Bot, label: "Auto-reply & AI" },
    ],
  },
  {
    label: "Contacts",
    items: [{ to: "/contacts", icon: Users, label: "Contacts" }],
  },
  {
    label: "Automation",
    items: [{ to: "/webhooks", icon: Webhook, label: "Webhooks" }],
  },
  {
    label: "Team",
    items: [{ to: "/team", icon: Users2, label: "Team" }],
  },
  {
    label: "Developer",
    items: [{ to: "/api-keys", icon: Key, label: "API Keys" }],
  },
];

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-gray-900 border-r border-gray-800 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:w-60 lg:translate-x-0 shrink-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Logo Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">
                WA Integration
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Control Center</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 min-h-0 px-3 py-3 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/dashboard"}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-brand-600/20 text-brand-400 border border-brand-500/20 shadow-sm"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/70"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="shrink-0 px-3 py-3 border-t border-gray-800 space-y-1 bg-gray-900">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-850/50">
              <div className="w-7 h-7 rounded-full bg-brand-600/20 flex items-center justify-center shrink-0 border border-brand-500/30">
                <User className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-200 truncate">
                  {user.name || "User"}
                </p>
                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
