/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useContext, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading, loginWithToken, logout } = useContext(AuthContext);

  // Use ref to prevent multiple token processing
  const tokenProcessed = useRef(false);
  const [processingToken, setProcessingToken] = useState(false);

  // Handle Google OAuth token from URL - runs only once
  useEffect(() => {
    const token = searchParams.get("token");

    // Only process if token exists and hasn't been processed yet
    if (token && !tokenProcessed.current) {
      tokenProcessed.current = true; // Mark as processed immediately
      setProcessingToken(true);

      console.log("Processing token from URL...");

      // Clear token from URL first
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("token");
      setSearchParams({}, { replace: true });

      // Process the token
      loginWithToken(token)
        .then((result) => {
          console.log("Token processing result:", result);
          setProcessingToken(false);

          if (!result.success) {
            console.error("Failed to login with token");
            navigate("/login");
          }
        })
        .catch((error) => {
          console.error("Token processing error:", error);
          setProcessingToken(false);
          navigate("/login");
        });
    }
  }, [loginWithToken, navigate, searchParams, setSearchParams]); // Empty dependency array - runs only once on mount

  // Redirect to login if not authenticated (after initial load)
  useEffect(() => {
    const token = searchParams.get("token");

    // Don't redirect if:
    // 1. Still loading
    // 2. Still processing token
    // 3. There's a token in URL (being processed)
    if (!loading && !processingToken && !token && !user) {
      console.log("No user, redirecting to login");
      navigate("/login");
    }
  }, [user, loading, processingToken, navigate, searchParams]);

  // Show loading state
  if (loading || processingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#012f72] mx-auto mb-4"></div>
          <p className="text-gray-600">
            {processingToken ? "Memproses login..." : "Memuat..."}
          </p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#012f72] mx-auto mb-4"></div>
          <p className="text-gray-600">Mengalihkan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-gray-50">
      {/* Dashboard content */}
      <div className="max-w-7xl mx-auto px-4 mt-16  sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#012f72]">
              Selamat Datang, {user.name}!
            </h1>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {user.email}
                </p>
                {user.phone && (
                  <p className="text-gray-600">
                    <span className="font-medium">Telepon:</span> {user.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Debug info - remove in production */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-500 font-mono">
              Debug: User ID = {user.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
