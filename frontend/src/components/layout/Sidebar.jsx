import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PenTool,
  BookOpen,
  CreditCard,
  Settings,
  Plus,
  X,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { getPlanBadge, PLAN_LIMITS } from "../../utils/helpers";
import { boardAPI } from "../../api";
import toast from "react-hot-toast";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/library", icon: BookOpen, label: "Library" },
  { to: "/billing", icon: CreditCard, label: "Billing" },
  { to: "/profile", icon: Settings, label: "Settings" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const plan = getPlanBadge(user?.plan);
  const limit = PLAN_LIMITS[user?.plan]?.boards ?? 1;

  const createBoard = async () => {
    try {
      const { data } = await boardAPI.createBoard({ title: "Untitled Board" });
      navigate(`/board/${data.data.id}`);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create board");
    }
  };

  return (
    <>
      {/* overlay (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-14 bottom-0 w-60 bg-white dark:bg-gray-900
                    border-r border-gray-200 dark:border-gray-700 z-20 flex flex-col
                    transition-transform duration-300
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0`}
      >
        {/* close btn (mobile) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* new board btn */}
          <button
            onClick={createBoard}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                       gradient-brand text-white text-sm font-semibold
                       hover:opacity-90 active:scale-95 transition-all mb-4"
          >
            <Plus className="w-4 h-4" />
            New Board
          </button>

          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                 ${
                   isActive
                     ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                     : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                 }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* plan badge */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div
            className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20
                          rounded-xl p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Current Plan
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${plan.color}`}
              >
                {plan.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {limit === -1
                ? "Unlimited boards"
                : `Up to ${limit} board${limit > 1 ? "s" : ""}`}
            </p>
            {user?.plan !== "premium" && (
              <NavLink
                to="/billing"
                onClick={onClose}
                className="block w-full text-center text-[11px] font-semibold py-1.5 rounded-lg
                           gradient-brand text-white hover:opacity-90 transition-opacity"
              >
                Upgrade Plan
              </NavLink>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
