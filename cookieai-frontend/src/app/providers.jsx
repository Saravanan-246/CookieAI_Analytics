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
  const [loading, setLoading] = useState(true);

  /* ================= INIT AUTH ================= */
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          if (isMounted) setLoading(false);
          return;
        }

        const res = await authService.getCurrentUser();

        const userData = res?.user || res?.data?.user;

        if (!userData) throw new Error("Invalid user");

        if (isMounted) {
          setUser(userData);
        }

      } catch (error) {
        console.error("Auth init failed:", error);

        localStorage.removeItem("token");

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ================= SIGNUP ================= */
  const signup = async (data) => {
    try {
      const res = await authService.signup(data);

      const token = res?.token || res?.data?.token;
      const userData = res?.user || res?.data?.user;

      if (!token || !userData) {
        throw new Error("Invalid signup response");
      }

      localStorage.setItem("token", token);
      setUser(userData);

      return userData;

    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  /* ================= LOGIN ================= */
  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);

      const token = res?.token || res?.data?.token;
      const userData = res?.user || res?.data?.user;

      if (!token || !userData) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", token);
      setUser(userData);

      return userData;

    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  /* ================= LOGOUT ================= */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);

    // 🔥 optional redirect (clean UX)
    window.location.href = "/login";
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