import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { adminAPI } from "../../api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency, formatDate } from "../../utils/helpers";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    setLoading(true);
    adminAPI
      .getAnalytics({ period })
      .then(({ data: d }) => setData(d.data))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>
        <select
          className="input-base max-w-[140px]"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* user growth */}
        <ChartCard title="User Growth">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.user_growth || []}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-700"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d) => formatDate(d, "MMM d")}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* board creation */}
        <ChartCard title="Board Creation">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.board_creation || []}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-700"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d) => formatDate(d, "MMM d")}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                name="Boards"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* plan distribution */}
        <ChartCard title="Plan Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data?.plan_distribution || []}
                dataKey="count"
                nameKey="plan"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ plan, percent }) =>
                  `${plan} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {(data?.plan_distribution || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* revenue by plan */}
        <ChartCard title="Revenue by Plan">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.revenue_by_plan || []}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-700"
              />
              <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar
                dataKey="revenue"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}
