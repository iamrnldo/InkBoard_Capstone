// src/api/index.js
import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://proposed-vania-inkboard-3f20703f.koyeb.app/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

/* ── Request interceptor ─────────────────────────────────── */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Response interceptor: auto-refresh ─────────────────── */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }
      original._retry = true;
      isRefreshing = true;
      const refresh = localStorage.getItem("refreshToken");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: refresh,
          });
          const { accessToken, refreshToken } = data.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          api.defaults.headers.Authorization = `Bearer ${accessToken}`;
          processQueue(null, accessToken);
          isRefreshing = false;
          return api(original);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(refreshErr);
        }
      }
    }
    return Promise.reject(err);
  },
);

/* ── Auth ────────────────────────────────────────────────── */
export const authAPI = {
  register: (d) => api.post("/auth/register", d),
  login: (d) => api.post("/auth/login", d),
  logout: () => api.post("/auth/logout"),
  verifyEmail: (t) => api.get(`/auth/verify-email?token=${t}`),
  resendVerification: (d) => api.post("/auth/resend-verification", d),
  forgotPassword: (d) => api.post("/auth/forgot-password", d),
  resetPassword: (d) => api.post("/auth/reset-password", d),
  getMe: () => api.get("/auth/me"),
  refresh: (d) => api.post("/auth/refresh", d),
};

/* ── Boards ──────────────────────────────────────────────── */
export const boardAPI = {
  getBoards: (p) => api.get("/boards", { params: p }),
  createBoard: (d) => api.post("/boards", d),
  getBoard: (id) => api.get(`/boards/${id}`),
  updateBoard: (id, d) => api.put(`/boards/${id}`, d),
  deleteBoard: (id) => api.delete(`/boards/${id}`),
  shareBoard: (id, d) => api.post(`/boards/${id}/share`, d),
  getSharedBoard: (token) => api.get(`/boards/share/${token}`),
  duplicateBoard: (id) => api.post(`/boards/${id}/duplicate`),
  addCollaborator: (id, d) => api.post(`/boards/${id}/collaborators`, d),
  removeCollaborator: (id, uid) =>
    api.delete(`/boards/${id}/collaborators/${uid}`),
};

/* ── User ────────────────────────────────────────────────── */
export const userAPI = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (d) => api.put("/user/profile", d),
  updatePreferences: (d) => api.put("/user/preferences", d),
  changePassword: (d) => api.put("/user/password", d),
  createPayment: (d) => api.post("/user/payment/create", d),
  getPaymentHistory: () => api.get("/user/payment/history"),
  getNotifications: () => api.get("/user/notifications"),
  markNotificationRead: (id) => api.put(`/user/notifications/${id}/read`),
};

/* ── AI ──────────────────────────────────────────────────── */
export const aiAPI = {
  textToDiagram: (d) => api.post("/ai/text-to-diagram", d),
  mermaidToInkboard: (d) => api.post("/ai/mermaid-to-inkboard", d),
  wireframeToCode: (d) => api.post("/ai/wireframe-to-code", d),
  getUsage: () => api.get("/ai/usage"),
};

/* ── Admin ───────────────────────────────────────────────── */
export const adminAPI = {
  getDashboard: () => api.get("/admin/dashboard"),
  getAnalytics: (p) => api.get("/admin/analytics", { params: p }),
  getUsers: (p) => api.get("/admin/users", { params: p }),
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, d) => api.put(`/admin/users/${id}`, d),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getBoards: (p) => api.get("/admin/boards", { params: p }),
  deleteBoard: (id) => api.delete(`/admin/boards/${id}`),
  getAdmins: () => api.get("/admin/admins"),
  inviteAdmin: (d) => api.post("/admin/admins/invite", d),
  acceptAdminInvitation: (d) => api.post("/admin/admins/accept-invitation", d),
  updateAdmin: (id, d) => api.put(`/admin/admins/${id}`, d),
  removeAdmin: (id) => api.delete(`/admin/admins/${id}`),
  getPayments: (p) => api.get("/admin/payments", { params: p }),
  getActivityLogs: (p) => api.get("/admin/activity-logs", { params: p }),
  getSiteSettings: () => api.get("/admin/settings"),
  updateSiteSettings: (d) => api.put("/admin/settings", d),
};

export default api;
