"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { adminSidebarItems } from '../page';
import { Bar, Line, Pie } from 'react-chartjs-2';
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
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState({
    userStats: { total: 0, students: 0, landlords: 0, agents: 0 },
    propertyStats: { total: 0, available: 0, booked: 0, inactive: 0 },
    revenueStats: { total: 0, monthly: [], yearly: 0 },
    applicationStats: { total: 0, pending: 0, approved: 0, rejected: 0 },
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports/?range=${dateRange}`, {
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

  const userChartData = {
    labels: ['Students', 'Landlords', 'Agents', 'Admins'],
    datasets: [
      {
        data: [
          reports.userStats.students,
          reports.userStats.landlords,
          reports.userStats.agents,
          reports.userStats.admins || 0,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const propertyChartData = {
    labels: ['Available', 'Booked', 'Inactive'],
    datasets: [
      {
        label: 'Properties',
        data: [
          reports.propertyStats.available,
          reports.propertyStats.booked,
          reports.propertyStats.inactive,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',
          'rgba(59, 130, 246, 0.5)',
          'rgba(156, 163, 175, 0.5)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const revenueChartData = {
    labels: reports.revenueStats.monthly?.map(stat => stat.month) || [],
    datasets: [
      {
        label: 'Revenue',
        data: reports.revenueStats.monthly?.map(stat => stat.amount) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <DashboardLayout sidebarItems={adminSidebarItems}>
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">
              {reports.userStats.total}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Properties</h3>
            <p className="text-3xl font-bold text-green-600">
              {reports.propertyStats.total}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">
              ${reports.revenueStats.total?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Pending Applications</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {reports.applicationStats.pending}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Distribution</h3>
            <div className="h-64">
              <Pie data={userChartData} />
            </div>
          </div>

          {/* Property Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Property Status</h3>
            <div className="h-64">
              <Bar data={propertyChartData} />
            </div>
          </div>
        </div>

        {/* Revenue Trends */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends</h3>
          <div className="h-64">
            {reports.revenueStats.monthly && reports.revenueStats.monthly.length > 0 ? (
              <Line data={revenueChartData} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No revenue data available for the selected period
              </div>
            )}
          </div>
        </div>

        {/* Application Statistics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Application Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{reports.applicationStats.total}</div>
              <div className="text-sm text-gray-500">Total Applications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{reports.applicationStats.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reports.applicationStats.approved}</div>
              <div className="text-sm text-gray-500">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{reports.applicationStats.rejected}</div>
              <div className="text-sm text-gray-500">Rejected</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
