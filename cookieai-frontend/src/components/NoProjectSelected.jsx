import { useNavigate } from "react-router-dom";

export default function NoProjectSelected() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">No project selected</h2>
        <p className="text-gray-500 mb-6">Create or select a site to view analytics</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/sites")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Go to Sites
          </button>
        </div>
      </div>
    </div>
  );
}
