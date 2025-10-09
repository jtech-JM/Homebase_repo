"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import ActionCard from "@/components/dashboard/ActionCard";
import RoleProtectedLayout from "@/components/auth/RoleProtectedLayout";
import Link from "next/link";

export const landlordSidebarItems = [
  { label: "Overview", href: "/dashboard/landlord", icon: "📊" },
  { label: "My Listings", href: "/dashboard/landlord/listings", icon: "🏠" },
  { label: "Applications", href: "/dashboard/landlord/applications", icon: "📝" },
  { label: "Tenants", href: "/dashboard/landlord/tenants", icon: "👥" },
  { label: "Messages", href: "/dashboard/landlord/messages", icon: "💬" },
  { label: "Payments", href: "/dashboard/landlord/payments", icon: "💰" },
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
            <h1 className="text-2xl font-bold">Landlord Dashboard</h1>
            <p className="text-gray-600">Manage your properties and tenants</p>
          </div>
          <Link
            href="/dashboard/landlord/listings/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add New Listing
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Active Listings" value={stats.activeListings} icon="🏠" />
          <StatCard
            title="Monthly Income"
            value={`$${(stats?.totalIncome ?? 0).toLocaleString()}`}
            icon="💰"
            trend={8}
          />
          <StatCard
            title="Occupancy Rate"
            value={`${stats.occupancyRate}%`}
            icon="📊"
          />
          <StatCard
            title="Pending Applications"
            value={stats.pendingApplications}
            icon="📝"
          />
        </div>

        {/* Listings & Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Listings */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Listings</h2>
            {listings.length === 0 ? (
              <p className="text-gray-500">No listings found.</p>
            ) : (
              <div className="space-y-4">
                {(listings).map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-lg shadow-sm p-4 flex items-start space-x-4"
                  >
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{listing.title}</h3>
                      <p className="text-sm text-gray-500">{listing.location}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-blue-600 font-semibold">
                          ${listing.price.toLocaleString()}/month
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${
                            listing.status === "Available"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {listing.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Applications</h2>
            {recentApplications.length === 0 ? (
              <p className="text-gray-500">No recent applications.</p>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <ul className="space-y-4">
                  {recentApplications.map((application) => (
                    <li
                      key={application.id}
                      className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg"
                    >
                      <img
                        src={application.studentImage}
                        alt={application.studentName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{application.studentName}</p>
                        <p className="text-sm text-gray-500">{application.propertyName}</p>
                        <div className="mt-2 flex space-x-2">
                          <button className="px-3 py-1 bg-green-500 text-white rounded-md text-sm">
                            Accept
                          </button>
                          <button className="px-3 py-1 bg-red-500 text-white rounded-md text-sm">
                            Decline
                          </button>
                          <button className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm">
                            Message
                          </button>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">{application.timeAgo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            title="Verify Your Account"
            description="Complete verification to build trust with tenants"
            actionLabel="Verify Now"
            icon="✅"
            onAction={() => {}}
          />
          <ActionCard
            title="Payment Settings"
            description="Set up or update your payment preferences"
            actionLabel="Configure"
            icon="💳"
            onAction={() => {}}
          />
          <ActionCard
            title="Support"
            description="Need help? Contact our support team"
            actionLabel="Get Help"
            icon="🎧"
            onAction={() => {}}
          />
        </div>
      </DashboardLayout>
    </RoleProtectedLayout>
  );
}  