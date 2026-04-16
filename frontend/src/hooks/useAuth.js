// src/hooks/useAuth.js
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

/**
 * Convenience hook wrapping authStore with navigation + toast side-effects.
 */
export default function useAuth() {
  const navigate = useNavigate();
  const store = useAuthStore();

  /* ── Login ── */
  const login = useCallback(
    async (email, password) => {
      const result = await store.login(email, password);
      if (result.success) {
        toast.success(`Welcome back, ${result.user.username}! 👋`);
        navigate(result.user.isAdmin ? "/admin" : "/dashboard", {
          replace: true,
        });
      } else {
        toast.error(result.message || "Login failed");
      }
      return result;
    },
    [store, navigate],
  );

  /* ── Register ── */
  const register = useCallback(
    async (username, email, password) => {
      const result = await store.register(username, email, password);
      if (result.success) {
        toast.success(
          "Account created! Please check your email to verify your account.",
        );
        navigate("/login");
      } else {
        toast.error(result.message || "Registration failed");
      }
      return result;
    },
    [store, navigate],
  );

  /* ── Logout ── */
  const logout = useCallback(async () => {
    await store.logout();
    navigate("/login", { replace: true });
    toast.success("Logged out successfully");
  }, [store, navigate]);

  /* ── Require plan ── */
  const requirePlan = useCallback(
    (plans, message) => {
      if (!store.user) return false;
      const allowed = Array.isArray(plans) ? plans : [plans];
      if (!allowed.includes(store.user.plan)) {
        toast.error(
          message ||
            `This feature requires ${allowed.join(" or ")} plan. Please upgrade.`,
        );
        navigate("/billing");
        return false;
      }
      return true;
    },
    [store.user, navigate],
  );

  /* ── Check AI access ── */
  const canUseAI = store.user?.plan === "premium";

  /* ── Check share-edit access ── */
  const canShareEdit = ["pro", "premium"].includes(store.user?.plan);

  /* ── Board limit check ── */
  const getBoardLimit = () => {
    const limits = { lite: 1, pro: 10, premium: -1 };
    return limits[store.user?.plan] ?? 1;
  };

  return {
    user: store.user,
    isAuth: store.isAuth,
    isLoading: store.isLoading,
    login,
    register,
    logout,
    fetchMe: store.fetchMe,
    updateUser: store.updateUser,
    requirePlan,
    canUseAI,
    canShareEdit,
    getBoardLimit,
  };
}
