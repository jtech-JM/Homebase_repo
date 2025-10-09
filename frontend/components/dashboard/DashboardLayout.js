"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children, sidebarItems, allowedRoles = [] }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-4 bg-blue-600 text-white">
          <span className="text-xl font-semibold">Homebase</span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mt-5 px-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {item.icon}
              <span className="mx-4">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`lg:ml-64 transition-margin duration-300 ease-in-out ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Top Navigation */}
        <div className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`lg:hidden ${isSidebarOpen ? 'hidden' : 'block'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              {session?.user && (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">{session.user.email}</span>
                  <img
                    src={session.user.image || '/default-avatar.png'}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}