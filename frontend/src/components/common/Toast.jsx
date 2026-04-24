// src/components/common/Toast.jsx
import React from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const COLORS = {
  success:
    "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300",
  error:
    "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300",
  warning:
    "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300",
  info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300",
};

const ICON_COLORS = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
};

/**
 * Custom toast component for react-hot-toast
 * Usage: toast.custom((t) => <Toast t={t} type="success" message="Done!" />)
 */
export default function Toast({ t, type = "info", title, message, onDismiss }) {
  const Icon = ICONS[type] || Info;

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-2xl border shadow-lg max-w-sm w-full
        transition-all duration-300
        ${COLORS[type]}
        ${t?.visible ? "animate-slide-in" : "opacity-0 translate-y-2"}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ICON_COLORS[type]}`} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold leading-tight">{title}</p>
        )}
        {message && (
          <p className={`text-sm ${title ? "mt-0.5 opacity-80" : ""}`}>
            {message}
          </p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-0.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ── Convenience helpers ──────────────────────────────────── */
export function ToastSuccess({ t, message, title = "Success" }) {
  return <Toast t={t} type="success" title={title} message={message} />;
}

export function ToastError({ t, message, title = "Error" }) {
  return <Toast t={t} type="error" title={title} message={message} />;
}
