import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Shield, CheckCircle, XCircle } from "lucide-react";
import { adminAPI } from "../../api";
import Button from "../../components/common/Button";
import { PageLoader } from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

export default function AcceptInvitation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [loading, setLoading] = useState(false);
  const token = params.get("token");

  useEffect(() => {
    if (!token) setStatus("error");
    else setStatus("ready");
  }, [token]);

  const accept = async () => {
    setLoading(true);
    try {
      await adminAPI.acceptAdminInvitation({ token });
      toast.success("Admin invitation accepted!");
      setStatus("success");
      setTimeout(() => navigate("/admin"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired token");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <PageLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="card p-10 max-w-md w-full text-center shadow-xl">
        {status === "success" ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome, Admin!
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Redirecting to admin panel…
            </p>
          </>
        ) : status === "error" ? (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Invalid Invitation
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              The invitation link is invalid or has expired.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Invitation
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You've been invited to become an admin on Inkboard. Click below to
              accept.
            </p>
            <Button
              fullWidth
              loading={loading}
              onClick={accept}
              size="lg"
              icon={Shield}
            >
              Accept Invitation
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
