"use client";
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, LogOut, User, Bell, Home } from 'lucide-react';
import LoadingBar from '../LoadingBar';
import PageTransition from '../PageTransition';
import UserAvatar from '../UserAvatar';

export default function DashboardLayout({ children, sidebarItems, allowedRoles = [] }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Prevent hydration by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Check if user has required role
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.user?.role)) {
      router.push('/dashboard');
    }
  }, [session, status, router, allowedRoles, isMounted]);

  // Fetch user profile to get avatar
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.accessToken || !isMounted) return;
      
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

    if (session && isMounted) {
      fetchProfile();
    }
  }, [session, isMounted]);

  // Don't render anything until mounted to prevent hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingBar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Loading Bar */}
      <LoadingBar />
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/60 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-all duration-300 ease-in-out overflow-y-auto`}>
        
        {/* Sidebar Header with Home Link */}
        <div className="flex items-center justify-between h-20 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white">
          <Link 
            href="/" 
            className="flex items-center space-x-2 group transition-all duration-200 hover:scale-105"
          >
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">HomeBase</span>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden hover:bg-white/20 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 px-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900 hover:shadow-md border border-transparent hover:border-gray-200/60'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${
                  isActive 
                    ? 'bg-white/20' 
                    : 'bg-gray-100 group-hover:bg-blue-50 text-gray-500 group-hover:text-blue-600'
                } transition-colors`}>
                  {item.icon}
                </div>
                <span className="ml-3 font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute right-3 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity ${
                  isActive ? 'opacity-10' : ''
                }`}></div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        {/* Top Navigation */}
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/60 sticky top-0 z-30">
          <div className="flex items-center justify-between h-20 px-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden hover:bg-gray-100/80 p-2.5 rounded-xl transition-all duration-200 hover:shadow-md"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-4">
              {session?.user && (
                <>
                  {/* Notifications */}
                  <button
                    className="relative p-2.5 text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all duration-200 hover:shadow-md group"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  </button>

                  {/* User Profile */}
                  <div className="flex items-center space-x-3 bg-white/60 rounded-xl px-3 py-2 border border-gray-200/60">
                    <UserAvatar 
                      user={{
                        avatar: userProfile?.avatar || session.user.avatar,
                        name: session.user.first_name || session.user.email?.split('@')[0] || 'User',
                        email: session.user.email
                      }} 
                      size="sm" 
                    />
                    <div className="hidden md:block">
                      <p className="text-sm font-semibold text-gray-800">
                        {session.user.first_name || session.user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize font-medium">{session.user.role}</p>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105 text-sm"
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