// src/pages/admin/AdminBoards.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Trash2,
  Globe,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { adminAPI } from "../../api";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { timeAgo, getPlanBadge } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function AdminBoards() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
  });

  const fetchBoards = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const { data } = await adminAPI.getBoards({ page, limit: 20, search });
        setBoards(data.data.boards);
        setPagination(data.data.pagination);
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchBoards(1), 300);
    return () => clearTimeout(t);
  }, [fetchBoards]);

  const deleteBoard = async (id) => {
    if (!window.confirm("Delete this board?")) return;
    try {
      await adminAPI.deleteBoard(id);
      toast.success("Board deleted");
      setBoards((prev) => prev.filter((b) => b.id !== id));
      setPagination((p) => ({ ...p, total: p.total - 1 }));
    } catch (err) {
      toast.error("Failed to delete board");
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Boards
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {pagination.total} total boards
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search boards or owners…"
            className="input-base pl-9 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No boards found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {["Title", "Owner", "Visibility", "Created", "Actions"].map(
                    (h) => (
                      <th key={h} className="px-4 py-3">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {boards.map((board) => {
                  const planBadge = getPlanBadge(board.owner_plan);
                  return (
                    <tr
                      key={board.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                          {board.title}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {board.id.slice(0, 8)}…
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {board.owner_username}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${planBadge.color}`}
                          >
                            {planBadge.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {board.is_public ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <Globe className="w-3.5 h-3.5" /> Public
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Lock className="w-3.5 h-3.5" /> Private
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {timeAgo(board.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteBoard(board.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete board"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
              onClick={() => fetchBoards(pagination.page - 1)}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= totalPages}
              onClick={() => fetchBoards(pagination.page + 1)}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
