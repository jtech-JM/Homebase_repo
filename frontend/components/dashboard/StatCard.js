export default function StatCard({ title, value, icon, trend, isLoading = false, error = false }) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm ${error ? 'border-red-200' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">
            {isLoading ? (
              <span className="animate-pulse bg-gray-200 h-8 w-24 inline-block rounded"></span>
            ) : error ? (
              <span className="text-red-500 text-base">Error loading data</span>
            ) : (
              value
            )}
          </p>
          {trend && (
            <div className={`flex items-center mt-2 ${
              trend > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="text-blue-500">
          {icon}
        </div>
      </div>
    </div>
  );
}