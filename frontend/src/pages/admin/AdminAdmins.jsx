import React, { useEffect, useState } from "react";
import { Shield, Plus, Trash2, Mail } from "lucide-react";
import { adminAPI } from "../../api";
import useAuthStore from "../../store/authStore";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { timeAgo, generateAvatarUrl } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function AdminAdmins() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.adminRole === "super_admin";
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "admin" });
  const [sending, setSending] = useState(false);

  const fetchAdmins = async () => {
    try {
      const { data } = await adminAPI.getAdmins();
      setAdmins(data.data);
    } catch (_) {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const inviteAdmin = async () => {
    if (!form.email) return toast.error("Email required");
    setSending(true);
    try {
      await adminAPI.inviteAdmin(form);
      toast.success("Invitation sent!");
      setInviteOpen(false);
      setForm({ email: "", role: "admin" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSending(false);
    }
  };

  const removeAdmin = async (id) => {
    if (!window.confirm("Remove this admin?")) return;
    try {
      await adminAPI.removeAdmin(id);
      toast.success("Admin removed");
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const ROLE_COLOR = {
    super_admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    admin:
      "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
    moderator:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Management
        </h1>
        {isSuperAdmin && (
          <Button icon={Plus} onClick={() => setInviteOpen(true)}>
            Invite Admin
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {[
                  "Admin",
                  "Role",
                  "Status",
                  "Invited By",
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
              {admins.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={a.avatar_url || generateAvatarUrl(a.username)}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {a.username}
                        </p>
                        <p className="text-xs text-gray-400">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLOR[a.role]}`}
                    >
                      {a.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        a.invitation_accepted && a.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {a.invitation_accepted ? "Active" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {a.invited_by_username || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {timeAgo(a.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {isSuperAdmin && a.role !== "super_admin" && (
                      <button
                        onClick={() => removeAdmin(a.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite Admin"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The user must have an existing Inkboard account. They'll receive an
            email invitation.
          </p>
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="admin@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Role
            </label>
            <select
              className="input-base"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={inviteAdmin} loading={sending} icon={Shield}>
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
