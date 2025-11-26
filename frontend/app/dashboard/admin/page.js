"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import ActionCard from '@/components/dashboard/ActionCard';
import Link from 'next/link';
import { Users, Building, Home, FileText, DollarSign, AlertTriangle, TrendingUp, Shield, Settings, MessageSquare, CreditCard, BarChart3 } from 'lucide-react';

export const adminSidebarItems = [
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
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    // Check authentication and role
    if (status === "loading") {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 bg-opacity-70 z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    </div>
  );
}


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
        setRecentActivities(data.recentActivities || []);
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
        setRecentActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

if (status === "loading") {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 bg-opacity-70 z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    </div>
  );
}


  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout sidebarItems={adminSidebarItems} allowedRoles={['admin']}>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of platform performance and key metrics</p>
        </div>
        <Link
          href="/dashboard/admin/settings"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Landlords</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalLandlords}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +8% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Listings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeListings}</p>
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +15% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">${stats.revenue.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +18% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Quick Actions</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Pending Verifications</h3>
              </div>
              <p className="text-gray-600 mb-4">15 users awaiting verification</p>
              <Link
                href="/dashboard/admin/users"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <Shield className="w-4 h-4" />
                Review Verifications
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Support Tickets</h3>
              </div>
              <p className="text-gray-600 mb-4">5 urgent tickets require attention</p>
              <Link
                href="/dashboard/admin/support"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <MessageSquare className="w-4 h-4" />
                View Tickets
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Issues</h3>
              </div>
              <p className="text-gray-600 mb-4">3 payment disputes need resolution</p>
              <Link
                href="/dashboard/admin/payments"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <CreditCard className="w-4 h-4" />
                Review Payments
              </Link>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-6 text-gray-900">System Alerts</h2>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <ul className="space-y-4">
              {alerts.length === 0 ? (
                <li className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-900">All Systems Operational</p>
                    <p className="text-sm text-emerald-700">No critical alerts at this time</p>
                  </div>
                </li>
              ) : (
                alerts.map((alert, index) => (
                  <li key={index} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-all duration-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{alert.time}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Recent Activity</h2>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No recent activities
                  </td>
                </tr>
              ) : (
                recentActivities.map((activity, index) => {
                  // Determine icon and color based on activity type
                  const getActivityIcon = (type) => {
                    switch(type) {
                      case 'user':
                        return { icon: Users, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' };
                      case 'property':
                        return { icon: Home, bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' };
                      case 'payment':
                        return { icon: CreditCard, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' };
                      case 'admin':
                        return { icon: Shield, bgColor: 'bg-amber-100', iconColor: 'text-amber-600' };
                      default:
                        return { icon: FileText, bgColor: 'bg-gray-100', iconColor: 'text-gray-600' };
                    }
                  };

                  const getStatusColor = (status) => {
                    const statusLower = status.toLowerCase();
                    if (statusLower.includes('completed') || statusLower.includes('active')) {
                      return 'bg-green-100 text-green-800';
                    } else if (statusLower.includes('pending')) {
                      return 'bg-blue-100 text-blue-800';
                    } else if (statusLower.includes('failed') || statusLower.includes('rejected')) {
                      return 'bg-red-100 text-red-800';
                    }
                    return 'bg-gray-100 text-gray-800';
                  };

                  const { icon: Icon, bgColor, iconColor } = getActivityIcon(activity.type);

                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center mr-3`}>
                            <Icon className={`w-4 h-4 ${iconColor}`} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{activity.action}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.user}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
