import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "../api";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuth: false,

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        set({ accessToken, refreshToken, isAuth: true });
      },

      setUser: (user) => set({ user, isAuth: !!user }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login({ email, password });
          const { accessToken, refreshToken, user } = data.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          set({
            user,
            accessToken,
            refreshToken,
            isAuth: true,
            isLoading: false,
          });
          return { success: true, user };
        } catch (err) {
          set({ isLoading: false });
          return {
            success: false,
            message: err.response?.data?.message || "Login failed",
          };
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true });
        try {
          await authAPI.register({ username, email, password });
          set({ isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return {
            success: false,
            message: err.response?.data?.message || "Registration failed",
          };
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (_) {}
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuth: false,
        });
      },

      fetchMe: async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          set({ isAuth: false });
          return;
        }
        try {
          const { data } = await authAPI.getMe();
          set({ user: data.data, isAuth: true });
        } catch (_) {
          set({ user: null, isAuth: false });
        }
      },

      updateUser: (updates) =>
        set((s) => ({ user: { ...s.user, ...updates } })),
    }),
    {
      name: "inkboard-auth",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuth: s.isAuth,
      }),
    },
  ),
);

export default useAuthStore;
