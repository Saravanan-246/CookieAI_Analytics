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

  // 🔥 IMPORTANT: start false → no UI blocking
  const [loading, setLoading] = useState(false);

  /* ================= INIT AUTH ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    let cancelled = false;

    const fetchUser = async () => {
      try {
        const res = await authService.getCurrentUser();

        const userData = res?.user || res?.data?.user;

        if (!userData) throw new Error("Invalid user");

        if (!cancelled) {
          setUser(userData);
        }
      } catch (error) {
        console.warn("Auth restore failed");

        localStorage.removeItem("token");

        if (!cancelled) {
          setUser(null);
        }
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ================= SIGNUP ================= */
  const signup = async (data) => {
    setLoading(true);

    try {
      const res = await authService.signup(data);

      const token = res?.token || res?.data?.token;
      const userData = res?.user || res?.data?.user;

      if (!token || !userData) {
        throw new Error("Invalid signup response");
      }

      localStorage.setItem("token", token);

      // 🔥 instant UI update (no refresh needed)
      setUser(userData);

      return userData;
    } catch (error) {
      console.error("Signup failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGIN ================= */
  const login = async (credentials) => {
    setLoading(true);

    try {
      const res = await authService.login(credentials);

      const token = res?.token || res?.data?.token;
      const userData = res?.user || res?.data?.user;

      if (!token || !userData) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", token);

      // 🔥 instant state update
      setUser(userData);

      return userData;
    } catch (error) {
      console.error("Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGOUT ================= */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);

    // 🔥 safe redirect
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  };

  /* ================= VALUE ================= */
  const value = {
    user,
    signup,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};