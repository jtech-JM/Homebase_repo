"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800"
};

export default function MaintenanceRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, in-progress, completed
  const [sortBy, setSortBy] = useState("date"); // date, priority, property

  useEffect(() => {
    fetchRequests();
  }, [filter, sortBy]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/maintenance-requests?status=${filter}&ordering=${sortBy === 'date' ? '-created_at' : sortBy === 'priority' ? '-priority' : '-created_at'}`);
      if (!response.ok) throw new Error('Failed to fetch maintenance requests');
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      const response = await fetch(`/api/maintenance-requests/${requestId}/update_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update request status');
      fetchRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Maintenance Requests</h2>
        <div className="space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="date">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="property">Sort by Property</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {requests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No maintenance requests found
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium">{request.title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[request.priority]}`}>
                        {request.priority}
                      </span>
                    </div>
                    <p className="text-gray-600">{request.description}</p>
                    <div className="text-sm text-gray-500">
                      <p>Property: {request.property.title}</p>
                      <p>Reported by: {request.tenant.name}</p>
                      <p>Submitted: {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                      ${request.status === 'completed' ? 'bg-green-100 text-green-800' :
                      request.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'}`}
                    >
                      {request.status}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/landlord/maintenance/${request.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                      {request.status !== 'completed' && (
                        <button
                          onClick={() => updateRequestStatus(request.id, 
                            request.status === 'pending' ? 'in-progress' : 'completed')}
                          className="text-green-600 hover:text-green-900"
                        >
                          {request.status === 'pending' ? 'Start Work' : 'Mark Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}