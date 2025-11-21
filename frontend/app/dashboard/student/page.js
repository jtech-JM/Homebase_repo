"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import ActionCard from '@/components/dashboard/ActionCard';
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';
import Link from 'next/link';
import { Search, Calendar, Heart, MessageCircle, User, GraduationCap, CreditCard, TrendingUp, MapPin, Star, LayoutDashboard, Home, Users, Headphones, DollarSign } from 'lucide-react';

export const studentSidebarItems = [
  { label: 'Overview', href: '/dashboard/student', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Search Housing', href: '/dashboard/student/search', icon: <Search className="w-5 h-5" /> },
  { label: 'My Bookings', href: '/dashboard/student/bookings', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Messages', href: '/dashboard/student/messages', icon: <MessageCircle className="w-5 h-5" /> },
  { label: 'Payments', href: '/dashboard/student/payments', icon: <DollarSign className="w-5 h-5" /> },
  { label: 'Community', href: '/dashboard/student/community', icon: <Users className="w-5 h-5" /> },
  { label: 'Support', href: '/dashboard/student/support', icon: <Headphones className="w-5 h-5" /> },
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/dashboard/`, {
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, Student!</h1>
          <p className="text-gray-600 mt-1">Find your perfect student accommodation</p>
        </div>
        <Link
          href="/dashboard/student/search"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Search className="w-5 h-5" />
          Start Search
        </Link>
      </div>

      {/* Profile Status and Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verification Status</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {profile.verificationStatus === 'verified' ? 'Verified' : 'Pending'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              profile.verificationStatus === 'verified'
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                : 'bg-gradient-to-br from-amber-500 to-amber-600'
            }`}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Bookings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{profile.activeBookings}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saved Listings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{profile.savedListings}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread Messages</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{profile.unreadMessages}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Recommended for You</h2>
          <div className="space-y-4">
            {recommendedListings.map((listing, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900">{listing.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-500 text-sm">{listing.location}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-blue-600 font-bold text-lg">${listing.price}/month</span>
                    <Link
                      href={`/dashboard/student/listing/${listing.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium"
                    >
                      <Star className="w-4 h-4" />
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Quick Actions</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
              </div>
              <p className="text-gray-600 mb-4">Add missing information to improve your chances</p>
              <Link
                href="/dashboard/student/profile"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <User className="w-4 h-4" />
                Update Profile
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Verify Your Student Status</h3>
              </div>
              <p className="text-gray-600 mb-4">Upload your student ID to get verified</p>
              <Link
                href="/verification"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <GraduationCap className="w-4 h-4" />
                Verify Now
              </Link>
            </div>

            {profile.activeBookings > 0 && (
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Rent Payment</h3>
                </div>
                <p className="text-gray-600 mb-4">Due in 5 days</p>
                <Link
                  href="/dashboard/student/payments"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Recent Activity</h2>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <ul className="space-y-6">
            {recentActivity.map((activity, index) => (
              <li key={index} className="flex items-start space-x-4 hover:bg-gray-50 rounded-lg p-3 transition-all duration-200">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{activity.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-2">{activity.time}</p>
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