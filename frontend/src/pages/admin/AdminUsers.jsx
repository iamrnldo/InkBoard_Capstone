// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  UserX,
  UserCheck,
  Eye,
  Shield,
  X,
} from "lucide-react";
import { adminAPI } from "../../api";
import useAuthStore from "../../store/authStore";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  timeAgo,
  formatDate,
  getPlanBadge,
  generateAvatarUrl,
  formatCurrency,
} from "../../utils/helpers";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────────────────────────
   User Detail Modal
───────────────────────────────────────────────────────────── */
function UserDetailModal({ userId, onClose, onUpdate }) {
  const { user: admin } = useAuthStore();
  const isSuperAdmin = admin?.adminRole === "super_admin";
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ plan: "", is_active: true });

  useEffect(() => {
    adminAPI
      .getUserDetail(userId)
      .then(({ data }) => {
        setDetail(data.data);
        setEditForm({
          plan: data.data.user.plan,
          is_active: data.data.user.is_active,
        });
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const saveChanges = async () => {
    setSaving(true);
    try {
      await adminAPI.updateUser(userId, editForm);
      toast.success("User updated!");
      onUpdate?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!window.confirm("Deactivate this user?")) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success("User deactivated");
      onUpdate?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="User Detail" size="xl">
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* User info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-750 rounded-xl">
            <img
              src={
                detail.user.avatar_url ||
                generateAvatarUrl(detail.user.username)
              }
              alt=""
              className="w-14 h-14 rounded-2xl"
            />
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">
                {detail.user.username}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {detail.user.email}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Joined {formatDate(detail.user.created_at)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Edit plan */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                Plan
              </label>
              <select
                className="input-base"
                value={editForm.plan}
                onChange={(e) =>
                  setEditForm({ ...editForm, plan: e.target.value })
                }
              >
                <option value="lite">Lite</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                Account Status
              </label>
              <select
                className="input-base"
                value={editForm.is_active ? "active" : "inactive"}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    is_active: e.target.value === "active",
                  })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Boards */}
          {detail.boards.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Recent Boards
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {detail.boards.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-750"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {b.title}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {timeAgo(b.updated_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Usage */}
          {detail.ai_usage.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                AI Usage
              </p>
              <div className="flex gap-2 flex-wrap">
                {detail.ai_usage.map((a) => (
                  <span
                    key={a.tool_type}
                    className="text-xs px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                  >
                    {a.tool_type.replace(/_/g, " ")}: {a.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            {isSuperAdmin && (
              <Button
                variant="danger"
                size="sm"
                icon={UserX}
                onClick={deleteUser}
              >
                Deactivate
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button loading={saving} size="sm" onClick={saveChanges}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────
   Admin Users
───────────────────────────────────────────────────────────── */
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
  });
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const { data } = await adminAPI.getUsers({
          page,
          limit: 20,
          search,
          plan: planFilter,
          status: statusFilter,
        });
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } finally {
        setLoading(false);
      }
    },
    [search, planFilter, statusFilter],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(1), 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const quickToggleStatus = async (userId, currentStatus) => {
    try {
      await adminAPI.updateUser(userId, { is_active: !currentStatus });
      toast.success(currentStatus ? "User deactivated" : "User activated");
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error("Failed to update user");
    }
    setMenuOpen(null);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {pagination.total} total users
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username or email…"
            className="input-base pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-base max-w-[130px]"
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
        >
          <option value="">All Plans</option>
          <option value="lite">Lite</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
        <select
          className="input-base max-w-[130px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {[
                    "User",
                    "Plan",
                    "Boards",
                    "Status",
                    "Joined",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((u) => {
                  const badge = getPlanBadge(u.plan);
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar_url || generateAvatarUrl(u.username)}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {u.username}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {u.board_count}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            u.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {timeAgo(u.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative flex items-center gap-1">
                          <button
                            onClick={() => setSelectedUser(u.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="View detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => quickToggleStatus(u.id, u.is_active)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.is_active
                                ? "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                : "text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                            }`}
                            title={u.is_active ? "Deactivate" : "Activate"}
                          >
                            {u.is_active ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Page {pagination.page} of {totalPages} · {pagination.total} users
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1)}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= totalPages}
              onClick={() => fetchUsers(pagination.page + 1)}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          userId={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => fetchUsers(pagination.page)}
        />
      )}
    </div>
  );
}
