// src/components/layout/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Settings,
  LogOut,
  User,
  Shield,
  ChevronDown,
  Moon,
  Sun,
  Menu,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { userAPI } from "../../api";
import { generateAvatarUrl, getPlanBadge, timeAgo } from "../../utils/helpers";
import toast from "react-hot-toast";

import inkboardLogo from "../../assets/logo/inkboard_logo.png";

export default function Navbar({ onMenuToggle }) {
  const { user, logout, theme, toggleTheme } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropRef = useRef(null);
  const notifRef = useRef(null);

  const darkMode = theme === "dark";

  /* ── Close on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Fetch notifications ── */
  useEffect(() => {
    if (!user) return;
    userAPI
      .getNotifications()
      .then(({ data }) => {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unread_count || 0);
      })
      .catch(() => {});
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const markRead = async (id) => {
    await userAPI.markNotificationRead(id);
    setNotifications((p) =>
      p.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const plan = getPlanBadge(user?.plan);

  return (
    <nav className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 sticky top-0 z-30">
      {/* Menu toggle (mobile) */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 mr-4">
        <div className="w-auto flex items-center justify-center">
          <img
            src={inkboardLogo}
            alt="Inkboard"
            className="h-12 w-auto object-contain"
            style={{ background: "transparent" }}
          />
        </div>
      </Link>

      <div className="flex-1" />

      {/* Dark mode toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800
                   transition-colors text-gray-500 dark:text-gray-400"
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {darkMode ? (
          <Sun className="w-4 h-4 text-yellow-500" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </button>

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => setNotifOpen((o) => !o)}
          className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800
                     transition-colors text-gray-500 dark:text-gray-400"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-slide-in overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 font-semibold text-sm text-gray-800 dark:text-gray-200">
              Notifications
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">
                  No notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                                ${!n.is_read ? "bg-primary-50/50 dark:bg-primary-900/10" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                      )}
                      <div className={!n.is_read ? "" : "ml-4"}>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User dropdown */}
      <div ref={dropRef} className="relative">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <img
            src={user?.avatar_url || generateAvatarUrl(user?.username || "U")}
            alt="avatar"
            className="w-7 h-7 rounded-full object-cover"
          />
          <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
            {user?.username}
          </span>
          <span
            className={`hidden sm:block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${plan.color}`}
          >
            {plan.label}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-slide-in overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                {user?.username}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <div className="p-1.5">
              <MenuItem
                icon={User}
                label="Profile"
                onClick={() => {
                  navigate("/profile");
                  setDropdownOpen(false);
                }}
              />
              <MenuItem
                icon={Settings}
                label="Settings"
                onClick={() => {
                  navigate("/profile");
                  setDropdownOpen(false);
                }}
              />
              {user?.isAdmin && (
                <MenuItem
                  icon={Shield}
                  label="Admin Panel"
                  onClick={() => {
                    navigate("/admin");
                    setDropdownOpen(false);
                  }}
                />
              )}
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <MenuItem
                icon={LogOut}
                label="Logout"
                onClick={handleLogout}
                danger
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    danger
                      ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
