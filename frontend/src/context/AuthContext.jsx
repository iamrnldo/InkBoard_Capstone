import { createContext, useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch user data on initial load only
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        try {
          const response = await fetch(`${API_URL}/api/user`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setToken(storedToken);
          } else {
            // Token is invalid
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }

      setLoading(false);
      setInitialLoad(false);
    };

    initializeAuth();
  }, []); // Empty dependency - runs only once

  // Login with email/password
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        if (data.needsVerification) {
          return {
            success: false,
            needsVerification: true,
            email: data.email,
            error: data.message,
          };
        }
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Terjadi kesalahan. Silakan coba lagi." };
    }
  };

  // Login with token (for Google OAuth) - MEMOIZED
  const loginWithToken = useCallback(async (newToken) => {
    console.log(
      "loginWithToken called with:",
      newToken?.substring(0, 20) + "..."
    );

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/user`, {
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      });

      console.log("API response status:", response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log("User data received:", userData);

        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(userData);
        setLoading(false);
        return { success: true, user: userData };
      } else {
        console.error("API response not ok");
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setLoading(false);
        return { success: false, error: "Token tidak valid" };
      }
    } catch (error) {
      console.error("Login with token error:", error);
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setLoading(false);
      return { success: false, error: "Terjadi kesalahan" };
    }
  }, []); // No dependencies - stable function

  // Register new user
  const register = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, email: data.email };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, error: "Terjadi kesalahan. Silakan coba lagi." };
    }
  };

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    initialLoad,
    isAuthenticated: !!user && !!token,
    login,
    loginWithToken,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
