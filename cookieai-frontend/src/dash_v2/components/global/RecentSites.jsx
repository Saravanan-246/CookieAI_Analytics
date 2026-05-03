export default function RecentSites({ sites = [] }) {
  return (
    <div className="bg-white border rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold mb-4">Recent Sites</h3>

      {sites.length === 0 ? (
        <p className="text-xs text-gray-400">No sites yet</p>
      ) : (
        <div className="space-y-3">
          {sites.map((s) => (
            <div
              key={s.id}
              className="flex justify-between items-center border-b pb-2 last:border-none"
            >
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-gray-400">{s.domain}</p>
              </div>

              <button className="text-xs text-blue-600">
                Open ?
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
