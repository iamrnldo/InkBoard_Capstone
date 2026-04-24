import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { authAPI } from "../../api";
import useAuthStore from "../../store/authStore";
import { PageLoader } from "../../components/common/LoadingSpinner";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [status, setStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    authAPI
      .verifyEmail(token)
      .then(({ data }) => {
        setTokens(data.data.accessToken, data.data.refreshToken);
        setUser(data.data.user);
        setStatus("success");
        setTimeout(() => navigate("/dashboard"), 2000);
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return <PageLoader />;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-950 dark:to-gray-900
                    flex items-center justify-center p-4"
    >
      <div className="card p-10 max-w-md w-full text-center shadow-xl">
        {status === "success" ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Redirecting to your dashboard…
            </p>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              The link is invalid or has expired.
            </p>
            <Link to="/resend-verification" className="btn-primary">
              Resend Email
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
