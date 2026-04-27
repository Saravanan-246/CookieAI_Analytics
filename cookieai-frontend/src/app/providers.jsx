import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/auth.service";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 🔥 start true → wait until auth checked
  const [loading, setLoading] = useState(true);

  /* ================= INIT AUTH ================= */
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return;
        }

        const res = await authService.getCurrentUser();

        const userData = res?.user || res?.data?.user;

        if (userData && !cancelled) {
          setUser(userData);
        }

      } catch (error) {
        console.warn("Auth restore failed");

        // 🔥 ONLY remove token if 401
        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          if (!cancelled) setUser(null);
        }

      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ================= LOGIN ================= */
  const login = async (credentials) => {
    const res = await authService.login(credentials);

    const userData = res?.user || res?.data?.user;

    setUser(userData);

    return userData;
  };

  /* ================= SIGNUP ================= */
  const signup = async (data) => {
    const res = await authService.signup(data);

    const userData = res?.user || res?.data?.user;

    setUser(userData);

    return userData;
  };

  /* ================= LOGOUT ================= */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  };

  /* ================= LOADING BLOCK (IMPORTANT) ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};