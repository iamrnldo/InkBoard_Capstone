// src/pages/profile/Profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Camera,
  Save,
  CreditCard,
  Shield,
  Moon,
  Sun,
  Globe,
  Bell,
  CheckCircle,
  Clock,
} from "lucide-react";
import { userAPI } from "../../api";
import useAuthStore from "../../store/authStore";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  formatCurrency,
  formatDate,
  getPlanBadge,
  generateAvatarUrl,
} from "../../utils/helpers";
import toast from "react-hot-toast";

function Section({ title, description, children }) {
  return (
    <div className="card p-6 space-y-5">
      <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Profile form ── */
  const [profileForm, setProfileForm] = useState({
    username: "",
    avatar_url: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  /* ── Password form ── */
  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
    confirm: "",
  });
  const [savingPw, setSavingPw] = useState(false);

  /* ── Preferences ── */
  const [prefs, setPrefs] = useState({ theme: "light", language: "en" });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    Promise.all([userAPI.getProfile(), userAPI.getPaymentHistory()])
      .then(([profileRes, paymentsRes]) => {
        const p = profileRes.data.data;
        setProfile(p);
        setProfileForm({
          username: p.username,
          avatar_url: p.avatar_url || "",
        });
        setPrefs(p.preferences || { theme: "light", language: "en" });
        setPayments(paymentsRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Save profile ── */
  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await userAPI.updateProfile({
        username: profileForm.username,
        avatar_url: profileForm.avatar_url,
      });
      updateUser(data.data);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Change password ── */
  const changePassword = async () => {
    if (pwForm.new_password.length < 8) return toast.error("Min 8 characters");
    if (pwForm.new_password !== pwForm.confirm)
      return toast.error("Passwords don't match");
    setSavingPw(true);
    try {
      await userAPI.changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success("Password changed!");
      setPwForm({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  /* ── Save preferences ── */
  const savePrefs = async (newPrefs) => {
    setSavingPrefs(true);
    try {
      await userAPI.updatePreferences(newPrefs);
      setPrefs(newPrefs);
      updateUser({ preferences: newPrefs });
      // Apply theme
      document.documentElement.classList.toggle(
        "dark",
        newPrefs.theme === "dark",
      );
      localStorage.setItem("theme", newPrefs.theme);
      toast.success("Preferences saved!");
    } catch (_) {
      toast.error("Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const planBadge = getPlanBadge(profile?.plan);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Profile & Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Manage your account information and preferences.
        </p>
      </div>

      {/* ── Avatar + Plan ── */}
      <div className="card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          <img
            src={
              profileForm.avatar_url ||
              generateAvatarUrl(profile?.username || "U")
            }
            alt="avatar"
            className="w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-lg"
          />
          <button className="absolute -bottom-2 -right-2 w-7 h-7 gradient-brand rounded-full flex items-center justify-center shadow text-white hover:opacity-90 transition-opacity">
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {profile?.username}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {profile?.email}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${planBadge.color}`}
            >
              {planBadge.label} Plan
            </span>
            {profile?.plan !== "premium" && (
              <button
                onClick={() => navigate("/billing")}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Upgrade →
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Member since {formatDate(profile?.created_at)}
          </p>
        </div>
        <div className="sm:ml-auto text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile?.board_count ?? 0}
          </p>
          <p className="text-xs text-gray-400">Boards</p>
        </div>
      </div>

      {/* ── Profile Info ── */}
      <Section
        title="Profile Information"
        description="Update your username and avatar."
      >
        <Input
          label="Username"
          icon={User}
          value={profileForm.username}
          onChange={(e) =>
            setProfileForm({ ...profileForm, username: e.target.value })
          }
          hint="3-30 characters, letters, numbers, underscores only"
        />
        <Input
          label="Avatar URL"
          icon={Camera}
          value={profileForm.avatar_url}
          onChange={(e) =>
            setProfileForm({ ...profileForm, avatar_url: e.target.value })
          }
          placeholder="https://example.com/avatar.png"
          hint="Paste an image URL for your avatar"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Mail className="w-3.5 h-3.5" />
            <span>{profile?.email}</span>
            {profile?.email_verified && (
              <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-1" />
            )}
          </div>
          <div className="flex-1" />
          <Button
            loading={savingProfile}
            onClick={saveProfile}
            icon={Save}
            size="sm"
          >
            Save Changes
          </Button>
        </div>
      </Section>

      {/* ── Password (only for non-OAuth users) ── */}
      {!profile?.oauth_provider && (
        <Section
          title="Change Password"
          description="Keep your account secure with a strong password."
        >
          <Input
            label="Current Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={pwForm.current_password}
            onChange={(e) =>
              setPwForm({ ...pwForm, current_password: e.target.value })
            }
          />
          <Input
            label="New Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={pwForm.new_password}
            onChange={(e) =>
              setPwForm({ ...pwForm, new_password: e.target.value })
            }
            hint="Minimum 8 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
          />
          <div className="flex justify-end">
            <Button
              loading={savingPw}
              onClick={changePassword}
              icon={Shield}
              size="sm"
            >
              Change Password
            </Button>
          </div>
        </Section>
      )}

      {/* ── Preferences ── */}
      <Section
        title="Preferences"
        description="Customize your Inkboard experience."
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {prefs.theme === "dark" ? (
              <Moon className="w-5 h-5 text-primary-500" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-500" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme
              </p>
              <p className="text-xs text-gray-400">
                Current: {prefs.theme === "dark" ? "Dark" : "Light"}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              savePrefs({
                ...prefs,
                theme: prefs.theme === "dark" ? "light" : "dark",
              })
            }
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0
                        ${prefs.theme === "dark" ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                          ${prefs.theme === "dark" ? "translate-x-5" : ""}`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Language
              </p>
            </div>
          </div>
          <select
            className="input-base max-w-[140px] text-sm"
            value={prefs.language}
            onChange={(e) => savePrefs({ ...prefs, language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="id">Indonesian</option>
          </select>
        </div>
      </Section>

      {/* ── Plan & Billing ── */}
      <Section title="Plan & Billing" description="Your subscription details.">
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border border-primary-100 dark:border-primary-800">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {planBadge.label} Plan
            </p>
            {profile?.plan_expires_at && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Expires {formatDate(profile.plan_expires_at)}
              </p>
            )}
            {profile?.plan === "lite" && (
              <p className="text-xs text-gray-400 mt-0.5">Free forever</p>
            )}
          </div>
          {profile?.plan !== "premium" && (
            <Button
              size="sm"
              onClick={() => navigate("/billing")}
              icon={CreditCard}
            >
              Upgrade
            </Button>
          )}
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Payment History
            </p>
            <div className="space-y-2">
              {payments.slice(0, 5).map((p) => {
                const planB = getPlanBadge(p.plan);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${planB.color}`}
                        >
                          {planB.label}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                            p.status === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : p.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(p.created_at)} · {p.order_id}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {formatCurrency(p.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
