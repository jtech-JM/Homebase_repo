import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based access control
    const roleRoutes = {
      student: /^\/dashboard\/student/,
      landlord: /^\/dashboard\/landlord/,
      agent: /^\/dashboard\/agent/,
      admin: /^\/dashboard\/admin/,
    };

    // Check if user is accessing a protected route
    for (const [role, pattern] of Object.entries(roleRoutes)) {
      if (pattern.test(path)) {
        // If user doesn't have the required role, redirect to their dashboard
        if (token?.role !== role) {
          // Redirect to appropriate dashboard based on user's role
          if (token?.role === 'pending') {
            return NextResponse.redirect(new URL('/select_role', req.url));
          }
          
          const userDashboard = token?.role 
            ? `/dashboard/${token.role}` 
            : '/dashboard';
          
          return NextResponse.redirect(new URL(userDashboard, req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Allow access to public routes
        if (
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/forgot-password') ||
          path.startsWith('/reset-password') ||
          path.startsWith('/verification') ||
          path.startsWith('/select_role') ||
          path === '/' ||
          path.startsWith('/_next') ||
          path.startsWith('/api/auth')
        ) {
          return true;
        }

        // Require authentication for dashboard routes
        if (path.startsWith('/dashboard')) {
          return !!token;
        }

        return true;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
};
