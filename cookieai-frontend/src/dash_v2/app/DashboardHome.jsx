import DashboardLayout from "./DashboardLayout";
import GlobalKpiGrid from "../components/global/GlobalKpiGrid";
import RecentSites from "../components/global/RecentSites";
import GlobalActivity from "../components/global/GlobalActivity";

export default function DashboardHome() {
  const data = {};
  const sites = [];
  const events = [];

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

        <h1 className="text-lg font-semibold text-gray-900">
          Dashboard
        </h1>

        <GlobalKpiGrid data={data} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentSites sites={sites} />
          <GlobalActivity events={events} />
        </div>

      </div>
    </DashboardLayout>
  );
}
