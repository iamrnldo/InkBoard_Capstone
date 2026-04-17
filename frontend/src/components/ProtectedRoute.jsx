import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading, token } = useContext(AuthContext);
  const location = useLocation();

  // Check if there's a token in URL (Google OAuth callback)
  const urlParams = new URLSearchParams(location.search);
  const urlToken = urlParams.get("token");

  // Show loading ONLY during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#012f72] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // ✅ FIX: If URL has token (Google OAuth callback), let Dashboard handle it
  if (urlToken) {
    return children; // Let Dashboard process the token
  }

  // Redirect to login if not authenticated
  if (!user && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
