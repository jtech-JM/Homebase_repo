"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { landlordSidebarItems } from '../page';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportsPage() {
  const { data: session } = useSession();
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
    monthlyStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('month'); // month, quarter, year

  useEffect(() => {
    if (session) {
      fetchReports();
    }
  }, [session, dateRange]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/landlord/reports/?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: reports.monthlyStats?.map(stat => stat.month) || [],
    datasets: [
      {
        label: 'Revenue',
        data: reports.monthlyStats?.map(stat => stat.amount) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Revenue Trends',
      },
    },
  };

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <DashboardLayout sidebarItems={landlordSidebarItems}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
          <div className="space-x-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Financial Summary */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Financial Summary</h2>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600">Monthly Revenue:</span>
                <span className="float-right font-semibold">
                  ${reports.revenue?.monthly?.toLocaleString() || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Yearly Revenue:</span>
                <span className="float-right font-semibold">
                  ${reports.revenue?.yearly?.toLocaleString() || 0}
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
                  {reports.occupancyRate || 0}%
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
                  {reports.maintenance?.pending || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Completed:</span>
                <span className="float-right font-semibold">
                  {reports.maintenance?.completed || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Trends</h2>
          <div className="h-64">
            {reports.monthlyStats && reports.monthlyStats.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for the selected period
              </div>
            )}
          </div>
        </div>

        {/* Additional reports and charts will be added here */}
      </div>
    </DashboardLayout>
  );
}
