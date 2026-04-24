import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { authAPI } from "../../api";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { AuthLayout } from "./Login";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Email required");
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch (_) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="We'll send you a reset link">
      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7 text-green-600" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            If an account exists for <strong>{email}</strong>, you'll receive a
            reset link shortly.
          </p>
          <Link
            to="/login"
            className="block text-primary-600 dark:text-primary-400 hover:underline text-sm"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" fullWidth loading={loading} size="lg">
            Send Reset Link
          </Button>
          <p className="text-center text-sm">
            <Link
              to="/login"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Back to login
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
