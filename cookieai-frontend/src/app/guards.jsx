import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./providers";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f7f8fc] flex items-center justify-center">

        {/* 🔥 CENTER BOX */}
        <div className="w-[260px] p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col items-center gap-4 animate-scaleIn">

          {/* SPINNER */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-gray-200" />
            <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>

          {/* TEXT */}
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-gray-800">
              Loading workspace
            </p>
            <p className="text-xs text-gray-500">
              Setting things up for you…
            </p>
          </div>

        </div>
      </div>
    );
  }

  /* ---------- NOT AUTH ---------- */
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  /* ---------- AUTH OK ---------- */
  return children;
};