import React, { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adminAPI } from "../../api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Button from "../../components/common/Button";
import { timeAgo } from "../../utils/helpers";

export default function AdminActivity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
  });

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getActivityLogs({ page, limit: 50 });
      setLogs(data.data.logs);
      setPagination(data.data.pagination);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(1);
  }, [fetch]);

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const ACTION_COLOR = (action) => {
    if (action.includes("delete") || action.includes("remove"))
      return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
    if (action.includes("create") || action.includes("register"))
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (action.includes("update") || action.includes("login"))
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Activity Logs
        </h1>
        <span className="text-sm text-gray-400">{pagination.total} logs</span>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {logs.map((log) => (
              <div
                key={log.id}
                className="px-5 py-3 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <span
                  className={`mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ACTION_COLOR(log.action)}`}
                >
                  {log.action.replace(/_/g, " ")}
                </span>
                <div className="flex-1 min-w-0">
                  {log.username && (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      @{log.username}
                    </p>
                  )}
                  {log.entity_type && log.entity_id && (
                    <p className="text-xs text-gray-400">
                      {log.entity_type} ·{" "}
                      <span className="font-mono">
                        {log.entity_id.slice(0, 8)}…
                      </span>
                    </p>
                  )}
                  {log.details && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {typeof log.details === "string"
                        ? log.details
                        : JSON.stringify(log.details).slice(0, 80)}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {timeAgo(log.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Page {pagination.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              disabled={pagination.page <= 1}
              onClick={() => fetch(pagination.page - 1)}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= totalPages}
              onClick={() => fetch(pagination.page + 1)}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
