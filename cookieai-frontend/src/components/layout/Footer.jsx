import React from "react";

const Footer = () => {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">

        {/* LEFT */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-gray-500 text-center sm:text-left">
          <span>© {new Date().getFullYear()} CookieAI</span>

          <a
            href="#"
            className="hover:text-gray-900 transition"
          >
            Privacy
          </a>

          <a
            href="#"
            className="hover:text-gray-900 transition"
          >
            Terms
          </a>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs sm:text-sm">
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;