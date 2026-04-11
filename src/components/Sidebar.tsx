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
  BookOpen,
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
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/analytics", icon: BarChart2, label: "Analytics" },
    ],
  },
  {
    label: "WhatsApp",
    items: [
      { to: "/provider-configs", icon: Settings2, label: "Provider Configs" },
      { to: "/sessions", icon: Layers, label: "Sessions" },
      { to: "/session-health", icon: HeartPulse, label: "Session Health" },
      { to: "/messages", icon: MessageSquare, label: "Messages" },
      { to: "/events", icon: Activity, label: "Events" },
    ],
  },
  {
    label: "Messaging",
    items: [
      { to: "/broadcast", icon: Radio, label: "Broadcast" },
      { to: "/scheduled", icon: Clock, label: "Scheduled" },
      { to: "/templates", icon: FileText, label: "Templates" },
      { to: "/auto-reply", icon: Bot, label: "Auto-reply" },
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
    items: [
      { to: "/api-keys", icon: Key, label: "API Keys" },
      { to: "/docs", icon: BookOpen, label: "API Docs" },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-gray-900 border-r border-gray-800 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">
            WA Integration
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-600/20 text-brand-400"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
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
      <div className="px-3 py-4 border-t border-gray-800 space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 text-gray-400">
            <User className="w-4 h-4 shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-200 truncate">
                {user.name || "User"}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>

      <div className="px-5 py-2 border-t border-gray-800">
        <p className="text-[10px] text-gray-600">API: localhost:3000</p>
      </div>
    </aside>
  );
}
