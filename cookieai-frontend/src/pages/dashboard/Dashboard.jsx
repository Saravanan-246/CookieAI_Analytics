import { useEffect, useState, useMemo } from "react";
import { siteService } from "../../services/site.service";
import { useAnalytics } from "../../hooks/useAnalytics";

/* ===== SKELETON ===== */
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

/* ===== MAIN ===== */
export default function Dashboard() {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState(
    localStorage.getItem("siteId") || null
  );
  const [loadingSites, setLoadingSites] = useState(true);

  /* ===== LOAD SITES ===== */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await siteService.getSites();
        const list = res || [];

        setSites(list);

        // 🔥 FIX: auto-select first site properly
        if (!siteId && list.length > 0) {
          const firstId = list[0]._id || list[0].siteId;
          setSiteId(firstId);
          localStorage.setItem("siteId", firstId);
        }
      } catch (err) {
        console.error("Sites load error:", err);
      } finally {
        setLoadingSites(false);
      }
    };

    load();
  }, []);

  /* ===== ANALYTICS ===== */
  const { data, isLoading } = useAnalytics(siteId);

  const currentSite = useMemo(
    () =>
      sites.find((s) => (s._id || s.siteId) === siteId),
    [sites, siteId]
  );

  // 🔥 FIX: correct fields
  const visitors = data?.totalPageViews || 0;

  const isPageLoading = loadingSites || (siteId && isLoading);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6 space-y-8">

      {/* ===== TOP BAR ===== */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">CookieAI</h1>
          <p className="text-sm text-gray-500">
            Privacy-first analytics platform
          </p>
        </div>

        {loadingSites ? (
          <Skeleton className="w-40 h-10" />
        ) : (
          <select
            value={siteId || ""}
            onChange={(e) => {
              setSiteId(e.target.value);
              localStorage.setItem("siteId", e.target.value);
            }}
            className="border px-3 py-2 rounded-lg text-sm bg-white"
          >
            {sites.map((s) => {
              const id = s._id || s.siteId;
              return (
                <option key={id} value={id}>
                  {s.name}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* ===== OVERVIEW ===== */}
      <div className="bg-white border rounded-2xl p-6">

        {isPageLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-16 w-full rounded-xl" />

            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-sm text-gray-500">Overview</h2>
                <h3 className="text-lg font-semibold text-gray-900 mt-1">
                  {currentSite?.name || "Project"}
                </h3>
                <p className="text-xs text-gray-400">
                  {currentSite?.domain}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Live
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-base font-medium text-gray-800">
                {visitors > 0
                  ? `${visitors} page views recorded`
                  : "No traffic yet — start tracking your users"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <Stat label="Visitors" value={data?.totalPageViews} />
              <Stat label="Views" value={data?.totalPageViews} />
              <Stat label="Active" value={data?.activeUsers} />
            </div>
          </>
        )}

      </div>

      {/* ===== HOW IT WORKS ===== */}
      <div className="bg-white border rounded-2xl p-6">
        <h2 className="text-sm font-medium mb-4 text-gray-700">
          How CookieAI Works
        </h2>

        <div className="grid md:grid-cols-3 gap-5">
          <Step title="1. Add Script" desc="Install tracking script" />
          <Step title="2. Collect Data" desc="Capture sessions" />
          <Step title="3. View Insights" desc="Analyze behavior" />
        </div>
      </div>

      {/* ===== SESSIONS ===== */}
      <div className="bg-white border rounded-2xl p-6">
        <h2 className="text-sm font-medium mb-4 text-gray-600">
          Recent Sessions
        </h2>

        {isPageLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : data?.sessions?.length ? (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {data.sessions.slice(0, 6).map((s, i) => (
              <div key={i} className="flex justify-between text-sm border-b pb-2">
                <span className="text-gray-600 truncate max-w-[200px]">
                  {s.path || "/"}
                </span>
                <span className="text-gray-400">
                  {s.device || "Unknown"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No session data yet
          </p>
        )}
      </div>
    </div>
  );
}

/* ===== SMALL COMPONENTS ===== */
const Stat = ({ label, value }) => (
  <div className="bg-gray-50 p-3 rounded-lg">
    <p className="text-xs text-gray-400">{label}</p>
    <p className="font-medium text-gray-800">{value || 0}</p>
  </div>
);

const Step = ({ title, desc }) => (
  <div className="p-4 bg-gray-50 rounded-xl border">
    <h4 className="font-medium text-gray-800">{title}</h4>
    <p className="text-sm text-gray-500">{desc}</p>
  </div>
);