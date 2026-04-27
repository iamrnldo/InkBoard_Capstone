// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/authStore";
import { PageLoader } from "./components/common/LoadingSpinner";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";

/* ── Pages ── */
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AuthCallback from "./pages/auth/AuthCallback";
import Dashboard from "./pages/dashboard/Dashboard";
import BoardEditor from "./pages/board/BoardEditor";
import SharedBoard from "./pages/board/SharedBoard";
import Profile from "./pages/profile/Profile";
import Billing from "./pages/payment/Billing";
import Payment from "./pages/payment/Payment";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBoards from "./pages/admin/AdminBoards";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminActivity from "./pages/admin/AdminActivity";
import AcceptInvitation from "./pages/admin/AcceptInvitation";
import Library from "./pages/library/Library";
/* ─────────────────────────────────────────────────────────────
   Route Guards
───────────────────────────────────────────────────────────── */

function PrivateRoute() {
  const { isAuth, user } = useAuthStore();
  if (!isAuth || !user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AdminRoute() {
  const { isAuth, user } = useAuthStore();
  if (!isAuth || !user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function PublicOnlyRoute() {
  const { isAuth, user } = useAuthStore();
  if (isAuth && user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/* ─────────────────────────────────────────────────────────────
   Main Layout (Navbar + Sidebar + content)
───────────────────────────────────────────────────────────── */
function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 pt-0">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-60 min-h-[calc(100vh-3.5rem)] overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   App
───────────────────────────────────────────────────────────── */
export default function App() {
  const { fetchMe, isAuth } = useAuthStore();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    fetchMe().finally(() => setBooting(false));
  }, [fetchMe]);

  if (booting) return <PageLoader />;

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
          },
        }}
      />

      <Routes>
        {/* ── Public only ── */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<LandingPage />} />;
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* ── Auth flow (no guard) ── */}
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/admin/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/board/share/:token" element={<SharedBoard />} />

        {/* ── Private: main app ── */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/boards" element={<Dashboard />} />
            <Route path="/library" element={<Library />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/payment/success" element={<Payment />} />
          </Route>
          {/* Board editor - full screen, no sidebar */}
          <Route path="/board/:id" element={<BoardEditor />} />
        </Route>

        {/* ── Admin ── */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="boards" element={<AdminBoards />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="admins" element={<AdminAdmins />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="activity" element={<AdminActivity />} />
          </Route>
        </Route>

        {/* ── Fallback ── */}
        <Route
          path="/"
          element={
            isAuth ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
