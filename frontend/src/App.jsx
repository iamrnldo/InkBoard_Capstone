import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";



import Header from "@/layouts/header";
import Footer from "@/layouts/footer";
import PortalPage from "@/pages/portal";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import VerifyEmail from "@/pages/VerifyEmail";
import VerificationPending from "@/pages/VerificationPending";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import EditProfile from "@/pages/profile/edit"; // Add this import
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <PortalPage />
              <Footer />
            </>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verification-pending" element={<VerificationPending />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Header />
              <Dashboard />
              <Footer />
            </ProtectedRoute>
          }
        />

        {/* Profile View Page */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Header />
              <Profile />
              <Footer />
            </ProtectedRoute>
          }
        />

        {/* Edit Profile Page */}
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <Header />
              <EditProfile />
              <Footer />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
