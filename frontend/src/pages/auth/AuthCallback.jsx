import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { PageLoader } from "../../components/common/LoadingSpinner";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens, fetchMe } = useAuthStore();

  useEffect(() => {
    const token = params.get("token");
    const refresh = params.get("refresh");
    if (token && refresh) {
      setTokens(token, refresh);
      fetchMe().then(() => navigate("/dashboard"));
    } else {
      navigate("/login?error=oauth_failed");
    }
  }, []);

  return <PageLoader />;
}
