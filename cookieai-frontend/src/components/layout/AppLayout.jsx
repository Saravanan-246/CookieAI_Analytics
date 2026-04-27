import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* 🔥 LOCK BODY SCROLL (SAFE FIX) */
  useEffect(() => {
    const original = document.body.style.overflow;

    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = original || "auto";
    }

    return () => {
      document.body.style.overflow = original || "auto";
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* SIDEBAR */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* MAIN */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* NAVBAR */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>

        {/* FOOTER */}
        <Footer />
      </div>
    </div>
  );
};

export default AppLayout;