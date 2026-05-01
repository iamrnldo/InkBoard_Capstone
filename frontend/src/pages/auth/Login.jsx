import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import useAuthStore from "../../store/authStore";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import toast from "react-hot-toast";

import inkboardLogo from "../../assets/logo/inkboard_logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.username}! 👋`);
      navigate(result.user.isAdmin ? "/admin" : "/dashboard");
    } else {
      toast.error(result.message);
      if (result.message?.includes("verify")) {
        setTimeout(() => navigate("/resend-verification"), 1500);
      }
    }
  };

  const oauthLogin = (provider) => {
    window.location.href = `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/${provider}`;
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Inkboard account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            icon={Lock}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPw((p) => !p)}
            className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 
               dark:hover:text-gray-300 transition-colors"
          >
            {showPw ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={isLoading} size="lg">
          Sign In
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white dark:bg-gray-800 text-xs text-gray-400">
            or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <OAuthBtn provider="google" onClick={() => oauthLogin("google")} />
        <OAuthBtn provider="github" onClick={() => oauthLogin("github")} />
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

function OAuthBtn({ provider, onClick }) {
  const configs = {
    google: {
      label: "Google",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
    },
    github: {
      label: "GitHub",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
      ),
    },
  };
  const c = configs[provider];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200
                 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium
                 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600
                 active:scale-95 transition-all"
    >
      {c.icon}
      {c.label}
    </button>
  );
}

// Ubah bagian logo di AuthLayout:
export function AuthLayout({ title, subtitle, children }) {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50
                    dark:from-gray-950 dark:via-gray-900 dark:to-gray-950
                    flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {/* logo */}
        <div className="text-center mb-8">
          <img
            src={inkboardLogo}
            alt="Inkboard"
            className="h-16 w-auto object-contain mx-auto mb-4"
            style={{ background: "transparent" }}
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {subtitle}
          </p>
        </div>
        <div className="card p-8 shadow-xl">{children}</div>
      </div>
    </div>
  );
}
