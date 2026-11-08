import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar (Desktop sticky & Mobile drawer) */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Global Topbar across ALL screens */}
        <Topbar
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
          isMobileSidebarOpen={mobileSidebarOpen}
        />

        {/* Screen Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
