import KpiGrid from "../cards/KpiGrid";

export default function GlobalKpiGrid({ data, loading }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
        Overall Performance
      </p>
      <KpiGrid data={data} loading={loading} />
    </div>
  );
}
