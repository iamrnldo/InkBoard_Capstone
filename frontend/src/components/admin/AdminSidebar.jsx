// src/components/admin/AdminSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  PenTool,
  CreditCard,
  Settings,
  Shield,
  BarChart3,
  FileText,
  ChevronRight,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/boards", icon: PenTool, label: "Boards" },
  { to: "/admin/payments", icon: CreditCard, label: "Payments" },
  { to: "/admin/admins", icon: Shield, label: "Admins" },
  { to: "/admin/activity", icon: FileText, label: "Activity Logs" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminSidebar({ isOpen, onClose, user }) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 bottom-0 w-60 bg-gray-900 dark:bg-gray-950
          border-r border-gray-800 z-30 flex flex-col
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
          <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">✏️</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Inkboard</p>
            <p className="text-gray-400 text-[11px]">Admin Panel</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-colors group
                ${
                  isActive
                    ? "bg-primary-600/20 text-primary-400 border border-primary-600/30"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        {user && (
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
              <img
                src={
                  user.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}&backgroundColor=6366f1&textColor=ffffff`
                }
                alt=""
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {user.username}
                </p>
                <p className="text-[11px] text-gray-500 capitalize truncate">
                  {user.adminRole?.replace("_", " ") || "admin"}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
