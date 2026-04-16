// src/components/admin/StatsCard.jsx
import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import LoadingSpinner from "../common/LoadingSpinner";

/**
 * @param {object}   props
 * @param {string}   props.label        - Card label
 * @param {string|number} props.value   - Main value
 * @param {string}   [props.sub]        - Subtitle / secondary info
 * @param {React.ElementType} props.icon - Lucide icon component
 * @param {string}   props.gradient     - Tailwind gradient classes (from-X to-Y)
 * @param {'up'|'down'|'neutral'} [props.trend]
 * @param {string}   [props.trendLabel] - e.g. "+12% this month"
 * @param {boolean}  [props.loading]
 * @param {Function} [props.onClick]
 */
export default function StatsCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient = "from-primary-500 to-purple-500",
  trend = "neutral",
  trendLabel,
  loading = false,
  onClick,
}) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColor =
    trend === "up"
      ? "text-green-500"
      : trend === "down"
        ? "text-red-400"
        : "text-gray-400";

  return (
    <div
      onClick={onClick}
      className={`
        card p-5 flex flex-col gap-3
        ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient}
                      flex items-center justify-center shadow-sm flex-shrink-0`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        {trendLabel ? (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}
          >
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{trendLabel}</span>
          </div>
        ) : (
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-gray-400">Loading…</span>
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {value ?? "—"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {label}
          </p>
          {sub && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {sub}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
