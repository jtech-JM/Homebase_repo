"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';

const agentSidebarItems = [
  { label: 'Overview', href: '/dashboard/agent', icon: '📊' },
  { label: 'Student Support', href: '/dashboard/agent/students', icon: '👨‍🎓' },
  { label: 'Landlord Support', href: '/dashboard/agent/landlords', icon: '🏘️' },
  { label: 'Property Verification', href: '/dashboard/agent/verification', icon: '✅' },
  { label: 'Applications', href: '/dashboard/agent/applications', icon: '📝' },
  { label: 'Tasks', href: '/dashboard/agent/tasks', icon: '📋' },
  { label: 'Reports', href: '/dashboard/agent/reports', icon: '📈' },
];

export default function AgentReports() {
  const { data: session } = useSession();
  const [reportData, setReportData] = useState({
    performance: {},
    activities: [],
    metrics: {}
  });
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/agent/reports?days=${dateRange}`, {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
          },
        });
        const data = await response.json();
        setReportData(data);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchReportData();
    }
  }, [session, dateRange]);

  const exportReport = async (format) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/agent/reports/export?format=${format}&days=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent-report-${dateRange}days.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  return (
    <RoleProtectedLayout allowedRoles={['agent']}>
      <DashboardLayout sidebarItems={agentSidebarItems}>
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Performance Reports</h1>
              <p className="text-gray-600">Track your performance and activity metrics</p>
            </div>
            <div className="flex space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button
                onClick={() => exportReport('pdf')}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Export PDF
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading reports...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">👨‍🎓</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Students Helped</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.metrics?.studentsHelped || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Verifications</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.metrics?.verificationsCompleted || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Applications</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.metrics?.applicationsProcessed || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.metrics?.averageRating || '4.8'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl mb-2 block">📈</span>
                  <p className="text-gray-500">Performance chart would be displayed here</p>
                  <p className="text-sm text-gray-400">Integration with charting library needed</p>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Recent Activities</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {reportData.activities?.length > 0 ? (
                  reportData.activities.map((activity, index) => (
                    <div key={index} className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{activity.icon || '📋'}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title || 'Activity'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.description || 'No description'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="text-gray-500">No recent activities to display</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Response Times</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Response Time</span>
                    <span className="text-sm font-medium">{reportData.metrics?.avgResponseTime || '2.5 hours'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fastest Response</span>
                    <span className="text-sm font-medium">{reportData.metrics?.fastestResponse || '15 minutes'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Resolution Rate</span>
                    <span className="text-sm font-medium">{reportData.metrics?.resolutionRate || '94%'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Task Completion</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tasks Completed</span>
                    <span className="text-sm font-medium">{reportData.metrics?.tasksCompleted || '47'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">On-time Completion</span>
                    <span className="text-sm font-medium">{reportData.metrics?.onTimeCompletion || '89%'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overdue Tasks</span>
                    <span className="text-sm font-medium">{reportData.metrics?.overdueTasks || '2'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </RoleProtectedLayout>
  );
}