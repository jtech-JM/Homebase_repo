'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RoleProtectedLayout({ children, allowedRoles }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status !== 'loading' && session?.user) {
      if (!allowedRoles.includes(session.user.role)) {
        router.push('/dashboard');
      }
    }
  }, [status, session, router, allowedRoles]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session || !allowedRoles.includes(session.user?.role)) {
    return null;
  }

  return <>{children}</>;
}