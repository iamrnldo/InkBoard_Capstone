import React, { useEffect, useState } from "react";
import {
  Users,
  PenTool,
  DollarSign,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { adminAPI } from "../../api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency, timeAgo, getPlanBadge } from "../../utils/helpers";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI
      .getDashboard()
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  if (!stats) return null;

  const { users, boards, revenue, ai, recent_users, recent_payments } = stats;

  const statCards = [
    {
      label: "Total Users",
      value: users.total,
      sub: `+${users.new_this_month} this month`,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      trend: "up",
    },
    {
      label: "Total Boards",
      value: boards.total,
      sub: `${boards.public_count} public`,
      icon: PenTool,
      color: "from-green-500 to-emerald-500",
      trend: "up",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(revenue.monthly_revenue),
      sub: `${revenue.successful_payments} paid`,
      icon: DollarSign,
      color: "from-primary-500 to-purple-500",
      trend: "up",
    },
    {
      label: "AI Usages",
      value: ai.total_usage,
      sub: `${ai.wireframe_to_code} wireframe ops`,
      icon: Zap,
      color: "from-orange-500 to-yellow-500",
      trend: "up",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Welcome back, Admin 👋
        </p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {card.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {card.label}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* plan distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { plan: "lite", count: users.lite_count },
          { plan: "pro", count: users.pro_count },
          { plan: "premium", count: users.premium_count },
        ].map(({ plan, count }) => {
          const badge = getPlanBadge(plan);
          const pct =
            users.total > 0 ? Math.round((count / users.total) * 100) : 0;
          return (
            <div key={plan} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.color}`}
                >
                  {badge.label}
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {count}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="gradient-brand h-2 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{pct}% of users</p>
            </div>
          );
        })}
      </div>

      {/* recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* recent users */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Recent Users
            </h2>
            <Link
              to="/admin/users"
              className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recent_users.map((u) => {
              const badge = getPlanBadge(u.plan);
              return (
                <div key={u.id} className="flex items-center gap-3">
                  <img
                    src={
                      u.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}&backgroundColor=6366f1&textColor=ffffff`
                    }
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {u.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {timeAgo(u.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* recent payments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Recent Payments
            </h2>
            <Link
              to="/admin/payments"
              className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recent_payments.map((p) => {
              const badge = getPlanBadge(p.plan);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {p.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {p.order_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {formatCurrency(p.amount)}
                    </p>
                    <span
                      className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
