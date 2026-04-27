import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../app/providers";
import { getActiveSiteId } from "../../utils/siteState";
import Skeleton from "../ui/Skeleton";
import {
  LayoutDashboard,
  BarChart3,
  Globe,
  CreditCard,
  User,
  Settings,
  LogOut,
} from "lucide-react";

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  /* 🔥 ALWAYS GET LATEST SITE ID FROM HELPER */
  const siteId = getActiveSiteId();

  /* 🔥 NAV (DYNAMIC) */
  const nav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },

    {
      name: "Analytics",
      href: siteId ? `/analytics/${siteId}` : "/analytics",
      icon: BarChart3,
      match: "/analytics",
    },

    {
      name: "Sites",
      href: "/sites",
      icon: Globe,
      match: "/sites",
    },

    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  /* 🔥 ACTIVE FIX - use startsWith for proper matching */
  const isActive = (item) => {
    if (item.match) {
      return location.pathname.startsWith(item.match);
    }
    return location.pathname === item.href;
  };

  return (
    <>
      {/* OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">

          {/* LOGO */}
          <div className="h-16 flex items-center px-6 border-b">
            <h1 className="text-lg font-semibold text-indigo-600 tracking-tight">
              CookieAI
            </h1>
          </div>

          {/* NAV */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`
                    group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition
                    ${
                      active
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    className={
                      active
                        ? "text-indigo-600"
                        : "text-gray-400 group-hover:text-gray-700"
                    }
                  />

                  <span>{item.name}</span>

                  {active && (
                    <span className="ml-auto w-1.5 h-5 bg-indigo-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* USER */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-4">
              {user ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-400 text-white flex items-center justify-center font-semibold">
                  {user.name?.charAt(0) || "U"}
                </div>
              ) : (
                <Skeleton className="w-10 h-10 rounded-full" />
              )}

              <div className="min-w-0 flex-1">
                {user ? (
                  <>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </>
                ) : (
                  <>
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-3 w-28" />
                  </>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;