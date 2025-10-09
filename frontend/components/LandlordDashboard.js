"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandlordDashboard({ user }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    propertyCount: 0,
    occupancyRate: 0,
    monthlyRevenue: 0,
    pendingRequests: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tabs = [
    { id: 'overview', label: 'Overview', href: '/dashboard/landlord' },
    { id: 'listings', label: 'Listings', href: '/dashboard/landlord/listings', 
      count: stats.propertyCount },
    { id: 'applications', label: 'Applications', href: '/dashboard/landlord/applications' },
    { id: 'tenants', label: 'Tenants', href: '/dashboard/landlord/tenants' },
    { id: 'maintenance', label: 'Maintenance', href: '/dashboard/landlord/maintenance', 
      count: stats.pendingRequests },
    { id: 'financials', label: 'Financials', href: '/dashboard/landlord/financials' },
    { id: 'documents', label: 'Documents', href: '/dashboard/landlord/documents' },
    { id: 'reports', label: 'Reports', href: '/dashboard/landlord/reports' },
  ];

  useEffect(() => {
    // Set active tab based on current path
    const path = window.location.pathname;
    const currentTab = tabs.find(tab => path === tab.href || path.startsWith(tab.href + '/'));
    if (currentTab) {
      setActiveTab(currentTab.id);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, activityRes] = await Promise.all([
        fetch('/api/landlord/dashboard', {
          headers: { 'Cache-Control': 'no-cache' },
        }),
        fetch('/api/landlord/activity', {
          headers: { 'Cache-Control': 'no-cache' },
        }),
      ]);

      if (!dashboardRes.ok) throw new Error(await dashboardRes.text() || 'Failed to fetch dashboard data');
      if (!activityRes.ok) throw new Error(await activityRes.text() || 'Failed to fetch activity');

      const [dashboardData, activityData] = await Promise.all([dashboardRes.json(), activityRes.json()]);

      setStats(statsData);
      setRecentActivity(activityData);
    } catch (err) {
      setError(err.message);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* Navigation Tabs */}
      <nav className="mb-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.count != null && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full 
                    ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Profile Section */}
      <section className="flex items-center gap-4 mb-6 bg-white p-6 rounded-lg shadow">
        <img
          src={user.avatar || "/default-avatar.png"}
          alt="Profile"
          className="w-16 h-16 rounded-full border"
        />
        <div>
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <span className={`px-2 py-1 rounded text-xs ${
            user.verified ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
          }`}>
            {user.verified ? "Verified" : "Unverified"}
          </span>
        </div>
        <button 
          onClick={() => router.push('/dashboard/landlord/profile')}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Edit Profile
        </button>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Properties</h3>
          <p className="text-2xl font-bold">{stats.propertyCount || 0}</p>
          <div className="mt-2 flex justify-between items-center">
            <Link href="/dashboard/landlord/properties" className="text-blue-600 text-sm hover:underline">
              View All →
            </Link>
            <Link href="/dashboard/landlord/properties/new" className="text-green-600 text-sm hover:underline">
              + Add New
            </Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Occupancy Rate</h3>
          <p className="text-2xl font-bold">{stats.occupancyRate || 0}%</p>
          <div className="mt-2">
            <Link href="/dashboard/landlord/tenants" className="text-blue-600 text-sm hover:underline">
              Manage Tenants →
            </Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Monthly Revenue</h3>
          <p className="text-2xl font-bold">${(stats.monthlyRevenue || 0).toLocaleString()}</p>
          <div className="mt-2">
            <Link href="/dashboard/landlord/financials" className="text-blue-600 text-sm hover:underline">
              View Financials →
            </Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Pending Requests</h3>
          <p className="text-2xl font-bold">{stats.pendingRequests || 0}</p>
          <div className="mt-2">
            <Link href="/dashboard/landlord/maintenance" className="text-blue-600 text-sm hover:underline">
              View Requests →
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions & Recent Activity */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/dashboard/landlord/properties/new" className="p-2 text-center bg-green-600 text-white rounded hover:bg-green-700">
              Add Property
            </Link>
            <Link href="/dashboard/landlord/maintenance/new" className="p-2 text-center bg-blue-600 text-white rounded hover:bg-blue-700">
              Create Task
            </Link>
            <Link href="/dashboard/landlord/documents" className="p-2 text-center bg-purple-600 text-white rounded hover:bg-purple-700">
              Upload Document
            </Link>
            <Link href="/dashboard/landlord/messages" className="p-2 text-center bg-yellow-600 text-white rounded hover:bg-yellow-700">
              Send Message
            </Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    activity.type === 'payment' ? 'bg-green-500' :
                    activity.type === 'maintenance' ? 'bg-yellow-500' :
                    activity.type === 'tenant' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}></span>
                  <p className="text-sm">
                    {activity.message}
                    <span className="text-gray-400 text-xs ml-2">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section>
        <h3 className="font-semibold mb-2">Trust & Safety</h3>
        <div className="bg-white rounded shadow p-4 flex items-center gap-2">
          <span>Verification badge progress:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            user.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
          }`}>
            {user.verified ? "Complete" : "Incomplete"}
          </span>
          <button className="ml-auto px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
            Complete Verification
          </button>
        </div>
      </section>
    </div>
  );
}
