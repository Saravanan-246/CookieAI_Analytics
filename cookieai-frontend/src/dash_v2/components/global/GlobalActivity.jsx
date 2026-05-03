import LiveFeed from "../realtime/LiveFeed";

export default function GlobalActivity({ events }) {
  return (
    <div className="bg-white border rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
      <LiveFeed events={events} />
    </div>
  );
}
