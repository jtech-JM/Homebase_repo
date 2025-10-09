'use client';
import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [reports, setReports] = useState({
    occupancyRate: 0,
    revenue: {
      monthly: 0,
      yearly: 0,
    },
    maintenance: {
      pending: 0,
      completed: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/landlord/reports`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Reports & Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Financial Summary */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Financial Summary</h2>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Monthly Revenue:</span>
              <span className="float-right font-semibold">
                ${reports.revenue.monthly.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Yearly Revenue:</span>
              <span className="float-right font-semibold">
                ${reports.revenue.yearly.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Property Stats */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Property Statistics</h2>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Occupancy Rate:</span>
              <span className="float-right font-semibold">
                {reports.occupancyRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Maintenance Overview */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Maintenance Overview</h2>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Pending Requests:</span>
              <span className="float-right font-semibold">
                {reports.maintenance.pending}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Completed:</span>
              <span className="float-right font-semibold">
                {reports.maintenance.completed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional reports and charts will be added here */}
    </div>
  );
}