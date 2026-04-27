import React from "react";
import { useLocation } from "react-router-dom";

const Navbar = ({ onMenuClick }) => {
  const location = useLocation();

  /* 🔥 MAP ROUTE → TITLE */
  const getTitle = () => {
    const path = location.pathname;

    if (path.startsWith("/dashboard")) return "Dashboard";
    if (path.startsWith("/analytics")) return "Analytics";
    if (path.startsWith("/sites")) return "Sites";
    if (path.startsWith("/billing")) return "Billing";
    if (path.startsWith("/profile")) return "Profile";
    if (path.startsWith("/settings")) return "Settings";

    return "Dashboard";
  };

  const title = getTitle();

  return (
    <header className="sticky top-0 z-30 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* MOBILE MENU */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          ☰
        </button>

        {/* 🔥 TITLE CENTER */}
        <h1 className="mx-auto text-lg font-semibold text-gray-900">
          {title}
        </h1>

        {/* RIGHT EMPTY (for spacing) */}
        <div className="w-6" />

      </div>
    </header>
  );
};

export default Navbar;