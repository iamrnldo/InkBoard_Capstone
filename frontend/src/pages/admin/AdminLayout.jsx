// src/pages/admin/AdminLayout.jsx
import React, { useState, useEffect } from "react";
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
  Moon,
  Sun,
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
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  /* ── Sync dark mode on mount ── */
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  /* ── Toggle dark mode ── */
  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast.success("Logged out");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* ── Overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 w-60
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-700
          z-30 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">✏️</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 dark:text-white">
              Inkboard
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Admin Panel
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                font-medium transition-colors group
                ${
                  isActive
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* Bottom: dark mode + user */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-sm font-medium transition-colors
                       text-gray-600 dark:text-gray-400
                       hover:bg-gray-100 dark:hover:bg-gray-800
                       hover:text-gray-900 dark:hover:text-gray-200"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-yellow-500" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-primary-500" />
                <span>Dark Mode</span>
              </>
            )}
            {/* Toggle indicator */}
            <div className="ml-auto">
              <div
                className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5
                            ${darkMode ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow transition-transform
                              ${darkMode ? "translate-x-4" : "translate-x-0"}`}
                />
              </div>
            </div>
          </button>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
              <img
                src={
                  user.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}&backgroundColor=6366f1&textColor=ffffff`
                }
                alt=""
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {user.username}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize truncate">
                  {user.adminRole?.replace("_", " ") || "admin"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white text-xs">✏️</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">
              Admin Panel
            </span>
          </div>
          {/* Dark mode toggle (mobile) */}
          <button
            onClick={toggleDark}
            className="ml-auto p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
