// src/pages/profile/Profile.jsx
import React, { useState, useEffect, useRef } from "react";
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
  Eye,
  EyeOff,
  Upload,
  X,
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

/* ── Password field with show/hide toggle ── */
function PasswordInput({ label, value, onChange, placeholder, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
          <Lock className="w-4 h-4" />
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder || "••••••••"}
          className="input-base pl-9 pr-10 w-full"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ── Image resizer utility ──
// Resizes any image to max 800×800px and compresses to <5MB as JPEG
function resizeImage(file, maxWidth = 800, maxHeight = 800, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate new dimensions keeping aspect ratio
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas resize failed"));
          // Wrap blob back into a File so FormData works normally
          const resized = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(resized);
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

// ── Avatar upload area ──
function AvatarUpload({ preview, username, onFileSelect, onRemove }) {
  const fileRef = useRef(null);
  const [resizing, setResizing] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Hard cap — even before resize (e.g. a 50MB raw photo is fine, we'll shrink it)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large (max 50MB source image)");
      return;
    }

    setResizing(true);
    try {
      const resized = await resizeImage(file);
      // Safety check — should never happen but just in case
      if (resized.size > 5 * 1024 * 1024) {
        toast.error("Could not compress image below 5MB, try a different photo");
        return;
      }
      onFileSelect(resized);
      toast.success(
        `Photo ready · ${(resized.size / 1024).toFixed(0)} KB`,
      );
    } catch (err) {
      toast.error("Failed to process image");
    } finally {
      setResizing(false);
      // Reset input so the same file can be re-selected if needed
      e.target.value = "";
    }
  };

  return (
    <div className="relative group w-fit">
      <div className="relative w-24 h-24">
        <img
          src={preview || generateAvatarUrl(username || "U")}
          alt="avatar"
          className="w-24 h-24 rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-lg"
        />
        {/* Overlay */}
        <div
          onClick={() => !resizing && fileRef.current?.click()}
          className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
        >
          {resizing ? (
            <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <>
              <Upload className="w-5 h-5 text-white" />
              <span className="text-[10px] text-white mt-1 font-medium">Upload</span>
            </>
          )}
        </div>
      </div>

      {/* Camera button */}
      <button
        type="button"
        onClick={() => !resizing && fileRef.current?.click()}
        disabled={resizing}
        className="absolute -bottom-2 -right-2 w-7 h-7 gradient-brand rounded-full flex items-center justify-center shadow text-white hover:opacity-90 transition-opacity z-10 disabled:opacity-50"
      >
        <Camera className="w-3.5 h-3.5" />
      </button>

      {/* Remove button */}
      {preview && !resizing && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow text-white hover:bg-red-600 transition-colors z-10"
          title="Remove photo"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
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
    full_name: "",
    username: "",
  });
  const [avatarFile, setAvatarFile] = useState(null); // File object
  const [avatarPreview, setAvatarPreview] = useState(null); // blob URL or existing URL
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
          full_name: p.full_name || "",
          username: p.username || "",
        });
        setAvatarPreview(p.avatar_url || null);
        setPrefs(p.preferences || { theme: "light", language: "en" });
        setPayments(paymentsRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Handle avatar file selection → local preview ── */
  const handleFileSelect = (file) => {
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url || null);
  };

  /* ── Save profile ── */
  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      let avatar_url = profile?.avatar_url || "";

      // If a new file was selected, upload it first
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        try {
          const { data: uploadData } = await userAPI.uploadAvatar(formData);
          avatar_url = uploadData.data?.avatar_url || avatar_url;
        } catch (uploadErr) {
          toast.error(
            uploadErr.response?.data?.message || "Avatar upload failed",
          );
          setSavingProfile(false);
          return; // ← stop here, don't save profile with broken avatar
        }
      }

      const { data } = await userAPI.updateProfile({
        full_name: profileForm.full_name,
        username: profileForm.username,
        avatar_url,
      });
      updateUser(data.data);
      setAvatarFile(null);
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

      {/* ── Avatar + Plan card ── */}
      <div className="card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <AvatarUpload
          preview={avatarPreview}
          username={profile?.username}
          onFileSelect={handleFileSelect}
          onRemove={handleAvatarRemove}
        />

        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {profile?.full_name || profile?.username}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            @{profile?.username}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
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

          {/* Upload hint */}
          {avatarFile && (
            <p className="text-xs text-primary-500 mt-1.5 font-medium">
              📷 New photo staged — save to apply
            </p>
          )}
        </div>

        <div className="sm:ml-auto text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile?.board_count ?? 0}
          </p>
          <p className="text-xs text-gray-400">Boards</p>
        </div>
      </div>

      {/* ── Profile Information ── */}
      <Section
        title="Profile Information"
        description="Update your name, username, and profile photo."
      >
        {/* Full Name */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              className="input-base pl-9 w-full"
              placeholder="Your full name"
              value={profileForm.full_name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, full_name: e.target.value })
              }
            />
          </div>
        </div>

        {/* Username */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <span className="text-sm">@</span>
            </div>
            <input
              type="text"
              className="input-base pl-7 w-full"
              placeholder="username"
              value={profileForm.username}
              onChange={(e) =>
                setProfileForm({ ...profileForm, username: e.target.value })
              }
            />
          </div>
          <p className="text-xs text-gray-400">
            3–30 characters, letters, numbers, underscores only
          </p>
        </div>

        {/* Email – read-only */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              className="input-base pl-9 w-full bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              value={profile?.email || ""}
              disabled
              readOnly
            />
            {profile?.email_verified && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Email address cannot be changed
            {profile?.email_verified && (
              <span className="text-green-500 ml-1">· Verified</span>
            )}
          </p>
        </div>

        <div className="flex justify-end pt-1">
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
          <PasswordInput
            label="Current Password"
            value={pwForm.current_password}
            onChange={(e) =>
              setPwForm({ ...pwForm, current_password: e.target.value })
            }
            placeholder="Enter current password"
          />
          <PasswordInput
            label="New Password"
            value={pwForm.new_password}
            onChange={(e) =>
              setPwForm({ ...pwForm, new_password: e.target.value })
            }
            placeholder="Min 8 characters"
            hint="Minimum 8 characters"
          />
          <PasswordInput
            label="Confirm New Password"
            value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            placeholder="Repeat new password"
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
