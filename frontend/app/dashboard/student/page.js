"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import ActionCard from '@/components/dashboard/ActionCard';
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';
import Link from 'next/link';

export const studentSidebarItems = [
  { label: 'Overview', href: '/dashboard/student', icon: '📊' },
  { label: 'Search Housing', href: '/dashboard/student/search', icon: '🔍' },
  { label: 'My Bookings', href: '/dashboard/student/bookings', icon: '📅' },
  { label: 'Messages', href: '/dashboard/student/messages', icon: '💬' },
  { label: 'Payments', href: '/dashboard/student/payments', icon: '💰' },
  { label: 'Community', href: '/dashboard/student/community', icon: '👥' },
  { label: 'Support', href: '/dashboard/student/support', icon: '🎧' },
];

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState({
    verificationStatus: 'pending',
    activeBookings: 0,
    savedListings: 0,
    unreadMessages: 0,
  });

  const [recommendedListings, setRecommendedListings] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/dashboard/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setProfile(data.profile || profile);
      setRecommendedListings(data.recommendedListings || []);
      setRecentActivity(data.recentActivity || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default data for demo purposes
      setRecommendedListings([
        {
          id: 1,
          title: 'Modern Studio Near Campus',
          location: 'University District',
          price: 800,
          image: '/placeholder.png'
        },
        {
          id: 2,
          title: 'Shared Apartment',
          location: 'Downtown',
          price: 600,
          image: '/placeholder.png'
        }
      ]);
      setRecentActivity([
        {
          icon: '🔍',
          title: 'Searched for apartments',
          description: 'Found 5 properties matching your criteria',
          time: '2 hours ago'
        },
        {
          icon: '📅',
          title: 'Booking confirmed',
          description: 'Your booking for Modern Studio has been confirmed',
          time: '1 day ago'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleProtectedLayout allowedRoles={['student']}>
      <DashboardLayout sidebarItems={studentSidebarItems}>
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-gray-600">Find your perfect student accommodation</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Start Search
          </button>
        </div>
      </div>

      {/* Profile Status and Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Verification Status"
          value={profile.verificationStatus === 'verified' ? 'Verified ✅' : 'Pending ⏳'}
          icon="🆔"
        />
        <StatCard
          title="Active Bookings"
          value={profile.activeBookings}
          icon="📅"
        />
        <StatCard
          title="Saved Listings"
          value={profile.savedListings}
          icon="❤️"
        />
        <StatCard
          title="Unread Messages"
          value={profile.unreadMessages}
          icon="💬"
        />
      </div>

      {/* Recommendations and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Recommended for You</h2>
          <div className="space-y-4">
            {recommendedListings.map((listing, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold">{listing.title}</h3>
                  <p className="text-gray-500 text-sm">{listing.location}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-blue-600 font-semibold">${listing.price}/month</span>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <ActionCard
              title="Complete Your Profile"
              description="Add missing information to improve your chances"
              actionLabel="Update Profile"
              icon="👤"
              onAction={() => {}}
            />
            <ActionCard
              title="Verify Your Student Status"
              description="Upload your student ID to get verified"
              actionLabel="Verify Now"
              icon="📚"
              onAction={() => {}}
            />
            {profile.activeBookings > 0 && (
              <ActionCard
                title="Upcoming Rent Payment"
                description="Due in 5 days"
                actionLabel="Pay Now"
                icon="💳"
                onAction={() => {}}
              />
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <ul className="space-y-4">
            {recentActivity.map((activity, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span>{activity.icon}</span>
                <div>
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
    </RoleProtectedLayout>
  );
}