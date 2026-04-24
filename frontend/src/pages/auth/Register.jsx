import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import useAuthStore from "../../store/authStore";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { AuthLayout } from "./Login";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.username) e.username = "Username is required";
    else if (form.username.length < 3) e.username = "Min 3 characters";
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username))
      e.username = "Letters, numbers, underscores only";
    if (!form.email) e.email = "Email is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Min 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const result = await register(form.username, form.email, form.password);
    if (result.success) {
      toast.success("Account created! Please check your email to verify.");
      navigate("/login");
    } else {
      toast.error(result.message);
    }
  };

  const oauthLogin = (provider) => {
    window.location.href = `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/${provider}`;
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start drawing with Inkboard for free"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          icon={User}
          placeholder="cooluser"
          value={form.username}
          onChange={set("username")}
          error={errors.username}
        />
        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          hint="Minimum 8 characters"
        />
        <Input
          label="Confirm Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
        />
        <Button type="submit" fullWidth loading={isLoading} size="lg">
          Create Account
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white dark:bg-gray-800 text-xs text-gray-400">
            or sign up with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {["google", "github"].map((p) => (
          <button
            key={p}
            onClick={() => oauthLogin(p)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200
                       dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium
                       text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600
                       active:scale-95 transition-all capitalize"
          >
            {p}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
