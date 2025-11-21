"use client";
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, LogOut, User, Bell } from 'lucide-react';
import LoadingBar from '../LoadingBar';
import PageTransition from '../PageTransition';
import UserAvatar from '../UserAvatar';

export default function DashboardLayout({ children, sidebarItems, allowedRoles = [] }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Check if user has required role
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.user?.role)) {
      router.push('/dashboard');
    }
  }, [session, status, router, allowedRoles]);

  // Fetch user profile to get avatar
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.accessToken) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/me/`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (session) {
      fetchProfile();
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Loading Bar */}
      <LoadingBar />
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out overflow-y-auto`}>
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <span className="text-xl font-semibold">Homebase</span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden hover:bg-blue-800 p-1 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-5 px-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 mt-2 rounded-lg transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}>{item.icon}</span>
                <span className="ml-3 font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute right-3 w-2 h-2 bg-white rounded-full animate-pulse"></span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`lg:ml-64 transition-margin duration-300 ease-in-out ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Top Navigation */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`lg:hidden ${isSidebarOpen ? 'hidden' : 'block'} hover:bg-gray-100 p-2 rounded-lg transition-colors`}
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center space-x-4">
              {session?.user && (
                <>
                  <button
                    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                  <div className="flex items-center space-x-3">
                    <UserAvatar 
                      user={{
                        avatar: userProfile?.avatar || session.user.avatar,
                        name: session.user.first_name || session.user.email?.split('@')[0] || 'User',
                        email: session.user.email
                      }} 
                      size="sm" 
                    />
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-700">
                        {session.user.first_name || session.user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{session.user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6 min-h-screen">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </div>
    </div>
  );
}