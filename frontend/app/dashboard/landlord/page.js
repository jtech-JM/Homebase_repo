"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import ActionCard from "@/components/dashboard/ActionCard";
import RoleProtectedLayout from "@/components/auth/RoleProtectedLayout";
import Link from "next/link";
import { Home, DollarSign, TrendingUp, FileText, Plus, CheckCircle, CreditCard, Headphones, Eye, MessageCircle, Check, X, User } from "lucide-react";

export const landlordSidebarItems = [
  { label: "Overview", href: "/dashboard/landlord", icon: "📊" },
  { label: "Profile", href: "/dashboard/landlord/profile", icon: "👤" },
  { label: "My Listings", href: "/dashboard/landlord/listings", icon: "🏠" },
  { label: "Applications", href: "/dashboard/landlord/applications", icon: "📝" },
  { label: "Tenants", href: "/dashboard/landlord/tenants", icon: "👥" },
  { label: "Messages", href: "/dashboard/landlord/messages", icon: "💬" },
  { label: "Payments", href: "/dashboard/landlord/payments", icon: "💰" },
  { label: "Financials", href: "/dashboard/landlord/financials", icon: "💳" },
  { label: "Maintenance", href: "/dashboard/landlord/maintenance", icon: "🔧" },
  { label: "Documents", href: "/dashboard/landlord/documents", icon: "📄" },
  { label: "Reports", href: "/dashboard/landlord/reports", icon: "📈" },
  { label: "Support", href: "/dashboard/landlord/support", icon: "🎧" },
];

export default function LandlordDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeListings: 0,
    totalIncome: 0,
    occupancyRate: 0,
    pendingApplications: 0,
  });
  const [listings, setListings] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [listingsRes, applicationsRes, statsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/?limit=5`, {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/applications/?limit=5`, {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/stats/`, {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
            },
          })
        ]);

        const listingsData = listingsRes.ok ? await listingsRes.json() : [];
        const applicationsData = applicationsRes.ok ? await applicationsRes.json() : [];
        const statsData = statsRes.ok ? await statsRes.json() : {};

        setStats(statsData);
        setListings(listingsData);
        setRecentApplications(applicationsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session]);

  if (!session || loading) {
    return <div className="p-4 text-center">Loading dashboard...</div>;
  }

  return (
    <RoleProtectedLayout allowedRoles={["landlord"]}>
      <DashboardLayout sidebarItems={landlordSidebarItems}>
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Landlord Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your properties and tenants</p>
          </div>
          <Link
            href="/dashboard/landlord/listings/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add New Listing
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Listings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeListings}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">${(stats?.totalIncome ?? 0).toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +8% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.occupancyRate}%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingApplications}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Listings & Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Listings */}
          <div>
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Your Listings</h2>
            {listings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
                <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No listings found.</p>
                <Link
                  href="/dashboard/landlord/listings/new"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Listing
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {(listings).map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100"
                  >
                    <div className="flex items-start space-x-4">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{listing.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{listing.location}</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-blue-600 font-bold text-lg">
                            ${listing.price.toLocaleString()}/month
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              listing.status === "Available"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {listing.status}
                          </span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Link
                            href={`/dashboard/landlord/listings/${listing.id}`}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                          <Link
                            href={`/dashboard/landlord/listings/${listing.id}/edit`}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 text-sm font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div>
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Recent Applications</h2>
            {recentApplications.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent applications.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <ul className="space-y-4">
                  {recentApplications.map((application) => (
                    <li
                      key={application.id}
                      className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-all duration-200"
                    >
                      <img
                        src={application.studentImage}
                        alt={application.studentName}
                        className="w-12 h-12 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{application.studentName}</p>
                        <p className="text-sm text-gray-600 mt-1">{application.propertyName}</p>
                        <div className="mt-4 flex gap-2">
                          <button className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all duration-200 text-sm font-medium">
                            <Check className="w-4 h-4" />
                            Accept
                          </button>
                          <button className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-sm font-medium">
                            <X className="w-4 h-4" />
                            Decline
                          </button>
                          <button className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 text-sm font-medium">
                            <MessageCircle className="w-4 h-4" />
                            Message
                          </button>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400 flex-shrink-0">{application.timeAgo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Verify Your Account</h3>
            </div>
            <p className="text-gray-600 mb-4">Complete verification to build trust with tenants</p>
            <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Verify Now
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Settings</h3>
            </div>
            <p className="text-gray-600 mb-4">Set up or update your payment preferences</p>
            <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium">
              <CreditCard className="w-4 h-4" />
              Configure
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Support</h3>
            </div>
            <p className="text-gray-600 mb-4">Need help? Contact our support team</p>
            <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium">
              <Headphones className="w-4 h-4" />
              Get Help
            </button>
          </div>
        </div>
      </DashboardLayout>
    </RoleProtectedLayout>
  );
}  