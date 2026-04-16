import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { authAPI } from "../../api";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { AuthLayout } from "./Login";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error("Min 8 characters");
    if (form.password !== form.confirm)
      return toast.error("Passwords don't match");
    setLoading(true);
    try {
      await authAPI.resetPassword({
        token: params.get("token"),
        password: form.password,
      });
      toast.success("Password reset! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          hint="Min 8 characters"
        />
        <Input
          label="Confirm Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        />
        <Button type="submit" fullWidth loading={loading} size="lg">
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
}
