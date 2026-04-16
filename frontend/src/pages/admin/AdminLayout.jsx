import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  PenTool,
  CreditCard,
  Settings,
  Shield,
  BarChart3,
  FileText,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/boards", icon: PenTool, label: "Boards" },
  { to: "/admin/payments", icon: CreditCard, label: "Payments" },
  { to: "/admin/admins", icon: Shield, label: "Admins" },
  { to: "/admin/activity", icon: FileText, label: "Activity Logs" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast.success("Logged out");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* ── Sidebar ── */}
      <>
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={`fixed left-0 top-0 bottom-0 w-60 bg-gray-900 dark:bg-gray-950 border-r border-gray-800 z-30 flex flex-col
                          transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        >
          {/* logo */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
              <span className="text-white text-sm">✏️</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Inkboard</p>
              <p className="text-gray-400 text-[11px]">Admin Panel</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {NAV.map(({ to, icon: Icon, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                   ${
                     isActive
                       ? "bg-primary-600/20 text-primary-400 border border-primary-600/30"
                       : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                   }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
                <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
              </NavLink>
            ))}
          </nav>

          {/* user */}
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
              <img
                src={
                  user?.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}&backgroundColor=6366f1&textColor=ffffff`
                }
                alt=""
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {user?.username}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {user?.adminRole || "admin"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-400 transition-colors p-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      </>

      {/* ── Main ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* top bar (mobile) */}
        <div className="h-14 glass border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-900 dark:text-white">
            Admin Panel
          </span>
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
