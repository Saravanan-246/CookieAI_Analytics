import React from "react";
import Skeleton from "./Skeleton";
import EmptyState from "./EmptyState";

const Table = ({
  headers = [],
  data = [],
  className = "",
  loading = false,
  emptyMessage = "No data available",
  striped = false,
  hover = true,
}) => {
  const align = (a) =>
    a === "right"
      ? "text-right"
      : a === "center"
      ? "text-center"
      : "text-left";

  /* ===== LOADING (REAL TABLE SKELETON) ===== */
  if (loading) {
    return (
      <div className="w-full overflow-x-auto rounded-2xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t">
                {headers.map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* ===== EMPTY ===== */
  if (!data.length) {
    return (
      <EmptyState
        title="No data"
        description={emptyMessage}
      />
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-gray-200">
      <table className={`w-full text-sm ${className}`}>
        
        {/* HEADER */}
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 font-medium text-gray-600 ${align(
                  h.align
                )}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* BODY */}
        <tbody className="divide-y">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`
                ${hover ? "hover:bg-gray-50" : ""}
                ${striped && rowIndex % 2 === 0 ? "bg-gray-50/40" : ""}
                transition-colors
              `}
            >
              {headers.map((h, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-4 py-3 text-gray-800 ${align(
                    h.align
                  )}`}
                >
                  {h.render
                    ? h.render(row[h.key], row)
                    : row[h.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;