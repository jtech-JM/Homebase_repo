export default function ActionCard({ title, description, actionLabel, onAction, icon }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0 text-blue-500">
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
          {actionLabel && (
            <button
              onClick={onAction}
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}