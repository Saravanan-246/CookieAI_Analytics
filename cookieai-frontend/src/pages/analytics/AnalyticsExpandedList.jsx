export default function AnalyticsExpandedList({ items, renderRow }) {
  if (!items.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 max-h-[220px] overflow-y-auto space-y-2 pr-1">
      {items.map((item, index) => (
        <div key={`rest-${item._id}-${index}`}>
          {renderRow(item, index)}
        </div>
      ))}
    </div>
  );
}