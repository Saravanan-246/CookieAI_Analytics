import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./providers";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  /* ---------- LOADING ---------- */
if (loading) {
  return (
    <div className="fixed inset-0 z-50 bg-[#f8fafc]">

      <div className="loader-wrapper">
        <div className="loader-box">

          <div className="loader" />

          <p className="loader-text">
            Loading CookieAI...
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