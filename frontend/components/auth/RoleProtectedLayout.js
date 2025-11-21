'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export default function RoleProtectedLayout({ children, allowedRoles }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Save the attempted URL for redirect after login
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const userRole = session.user.role;

      // Check if user has pending role selection
      if (userRole === 'pending') {
        router.push('/select_role');
        return;
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        // Redirect to unauthorized page
        router.push('/unauthorized');
        return;
      }

      // User is authorized
      setIsAuthorized(true);
    }
  }, [status, session, router, allowedRoles, pathname]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Not authorized (wrong role)
  if (!isAuthorized || !allowedRoles.includes(session?.user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}