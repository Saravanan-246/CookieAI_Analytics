import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./guards";

import AppLayout from "../components/layout/AppLayout";

/* ---------- PAGES ---------- */
import Dashboard from "../pages/dashboard/Dashboard";
import Analytics from "../pages/analytics/Analytics";
import Sites from "../pages/sites/Sites";
import Billing from "../pages/billing/Billing";
import Profile from "../pages/profile/Profile";
import Settings from "../pages/settings/Settings";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

/* ---------- ROUTER ---------- */
export const router = createBrowserRouter([

  /* ================= AUTH ================= */
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },

  /* ================= APP ================= */
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [

      /* 🔥 DEFAULT */
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },

      /* ---------- MAIN ---------- */
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "analytics/:siteId",
        element: <Analytics />,
      },
      {
        path: "sites",
        element: <Sites />,
      },
      {
        path: "billing",
        element: <Billing />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "settings",
        element: <Settings />,
      },

      /* 🔥 APP 404 */
      {
        path: "*",
        element: <Navigate to="dashboard" replace />,
      },
    ],
  },

  /* 🔥 GLOBAL FALLBACK */
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);