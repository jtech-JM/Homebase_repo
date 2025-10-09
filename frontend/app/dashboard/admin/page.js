"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import ActionCard from '@/components/dashboard/ActionCard';

const adminSidebarItems = [
  { label: 'Overview', href: '/dashboard/admin', icon: '📊' },
  { label: 'User Management', href: '/dashboard/admin/users', icon: '👥' },
  { label: 'Property Management', href: '/dashboard/admin/properties', icon: '🏠' },
  { label: 'Applications', href: '/dashboard/admin/applications', icon: '📝' },
  { label: 'Payments', href: '/dashboard/admin/payments', icon: '💰' },
  { label: 'Reports', href: '/dashboard/admin/reports', icon: '📈' },
  { label: 'Support', href: '/dashboard/admin/support', icon: '🎧' },
  { label: 'Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLandlords: 0,
    activeListings: 0,
    pendingApplications: 0,
    revenue: 0,
  });

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Check authentication and role
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(false);
      try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`, {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setStats(data.stats);
        setAlerts(data.alerts);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(true);
        // Set default values in case of error
        setStats({
          totalStudents: 0,
          totalLandlords: 0,
          activeListings: 0,
          pendingApplications: 0,
          revenue: 0,
        });
        setAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout sidebarItems={adminSidebarItems} allowedRoles={['admin']}>
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of platform performance and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon="👨‍🎓"
          isLoading={isLoading}
          error={error}
        />
        <StatCard
          title="Total Landlords"
          value={stats.totalLandlords}
          icon="🏘️"
          isLoading={isLoading}
          error={error}
        />
        <StatCard
          title="Active Listings"
          value={stats.activeListings}
          icon="🏠"
          isLoading={isLoading}
          error={error}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.revenue}`}
          icon="💰"
          trend={12}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Quick Actions and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <ActionCard
              title="Pending Verifications"
              description="15 users awaiting verification"
              actionLabel="Review"
              icon="✅"
              onAction={() => {}}
            />
            <ActionCard
              title="Support Tickets"
              description="5 urgent tickets require attention"
              actionLabel="View Tickets"
              icon="🎫"
              onAction={() => {}}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Alerts</h2>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <ul className="space-y-4">
              {alerts.map((alert, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="text-red-500">⚠️</span>
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-gray-500">{alert.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Add activity rows here */}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}