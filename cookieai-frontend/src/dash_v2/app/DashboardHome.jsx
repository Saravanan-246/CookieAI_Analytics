import { useEffect, useState } from "react";

import DashboardLayout from "./DashboardLayout";

import GlobalKpiGrid from "../components/global/GlobalKpiGrid";
import RecentSites from "../components/global/RecentSites";
import GlobalActivity from "../components/global/GlobalActivity";

import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { siteService } from "../../services/site.service";

export default function DashboardHome() {

  const navigate = useNavigate();

  /* STATES */
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  /* REAL DASHBOARD DATA */
  const [data, setData] = useState({
    pageViews: 0,
    sessions: 0,
    activeUsers: 0,
    bounceRate: 0,
  });

  const [events, setEvents] = useState([]);

  /* LOAD REAL DATA */
  useEffect(() => {

    const loadDashboard = async () => {

      try {

        setLoading(true);

        /* GET SITES */
        const res = await siteService.getSites(true);

        console.log("Sites Response:", res);

        const list = Array.isArray(res)
          ? res
          : res?.data || [];

        setSites(list);

        /* REAL KPI FROM SITES */
        if (list.length > 0) {

          const totalViews = list.reduce(
            (acc, site) => acc + (site.pageViews || 0),
            0
          );

          const totalSessions = list.reduce(
            (acc, site) => acc + (site.sessions || 0),
            0
          );

          const totalUsers = list.reduce(
            (acc, site) => acc + (site.activeUsers || 0),
            0
          );

          setData({
            pageViews: totalViews,
            sessions: totalSessions,
            activeUsers: totalUsers,
            bounceRate: 0,
          });

          /* RECENT EVENTS */
          const recentEvents = list.flatMap((site) =>
            (site.events || []).map((event) => ({
              ...event,
              siteName: site.name,
            }))
          );

          setEvents(recentEvents);
        }

      } catch (err) {

        console.error("Failed to load dashboard:", err);

      } finally {

        setLoading(false);

      }
    };

    loadDashboard();

  }, []);

  const hasSites = sites.length > 0;

  /* LOADING */
  if (loading) {

    return (

      <DashboardLayout>

        <div className="min-h-[calc(100vh-70px)] bg-[#fafafa] flex items-center justify-center">

          <div className="text-center">

            <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />

            <p className="text-sm text-gray-500">
              Loading dashboard...
            </p>

          </div>

        </div>

      </DashboardLayout>
    );
  }

  return (

    <DashboardLayout>

      {!hasSites ? (

        /* EMPTY STATE */
        <div className="min-h-[calc(100vh-70px)] bg-[#fafafa] flex items-center justify-center px-6 py-10 overflow-hidden">

          <div className="w-full max-w-5xl text-center">

            {/* IMAGE */}
            <img
              src="/create.png"
              alt="Create Project"
              className="w-full max-w-[420px] mx-auto object-contain mb-5 select-none"
            />

            {/* LABEL */}
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-[0.22em] mb-4">
              Create Project
            </p>

            {/* TITLE */}
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.92] text-gray-900">

              Create Your First

              <span className="block text-violet-600 mt-2">
                Analytics Project
              </span>

            </h1>

            {/* DESCRIPTION */}
            <p className="mt-7 text-lg md:text-xl text-gray-500 leading-relaxed max-w-3xl mx-auto">

              Monitor realtime visitors, sessions,
              countries, devices, and AI-powered
              insights with CookieAI.

            </p>

            {/* BUTTON */}
            <div className="pt-8">

              <button
                onClick={() => navigate("/sites")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-violet-600 text-white font-semibold hover:bg-violet-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-violet-200"
              >

                <Plus size={18} />

                Create Project

              </button>

            </div>

          </div>

        </div>

      ) : (

        /* REAL DASHBOARD */
        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

          {/* HEADER */}
          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard
              </h1>

              <p className="text-sm text-gray-400 mt-1">
                Monitor your analytics and realtime traffic
              </p>

            </div>

          </div>

          {/* REAL KPI */}
          <GlobalKpiGrid data={data} />

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* REAL SITES */}
            <RecentSites sites={sites} />

            {/* REAL EVENTS */}
            <GlobalActivity events={events} />

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}