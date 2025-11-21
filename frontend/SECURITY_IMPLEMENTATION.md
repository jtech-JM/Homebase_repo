# Security Implementation - Role-Based Access Control

This document outlines the comprehensive security implementation for protecting student and other role-based routes in the HomeBase application.

## Overview

The application now has **three layers of protection** for role-based access control:

1. **Next.js Middleware** (Server-side)
2. **Layout-based Protection** (Client-side)
3. **Component-level Protection** (RoleProtectedLayout)

## 1. Next.js Middleware Protection

**File:** `frontend/middleware.js`

### Features:
- **Server-side protection** - Runs before page loads
- **Role-based routing** - Automatically redirects users to appropriate dashboards
- **Authentication check** - Verifies user is logged in
- **Token validation** - Uses NextAuth token for verification

### Protected Routes:
- `/dashboard/student/*` - Student only
- `/dashboard/landlord/*` - Landlord only
- `/dashboard/agent/*` - Agent only
- `/dashboard/admin/*` - Admin only

### How it works:
```javascript
// If a student tries to access /dashboard/landlord
// They are automatically redirected to /dashboard/student

// If an unauthenticated user tries to access any dashboard
// They are redirected to /login
```

## 2. Layout-based Protection

**Files:**
- `frontend/app/dashboard/student/layout.js`
- `frontend/app/dashboard/landlord/layout.js`
- `frontend/app/dashboard/agent/layout.js`
- `frontend/app/dashboard/admin/layout.js`

### Features:
- **Automatic protection** for all child routes
- **No need to add protection to individual pages**
- **Loading states** while checking authentication
- **Callback URL preservation** for post-login redirect

### Benefits:
- Protects ALL pages in the directory automatically
- Single point of control for each role
- Consistent user experience
- Reduces code duplication

### Example:
```javascript
// All these routes are automatically protected:
/dashboard/student/
/dashboard/student/search
/dashboard/student/bookings
/dashboard/student/messages
/dashboard/student/profile
// ... and all other student routes
```

## 3. Component-level Protection

**File:** `frontend/components/auth/RoleProtectedLayout.js`

### Features:
- **Granular control** for specific components
- **Multiple role support** - Can allow multiple roles per component
- **Enhanced error handling** with visual feedback
- **Callback URL support** for seamless redirects

### Usage:
```javascript
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';

export default function MyPage() {
  return (
    <RoleProtectedLayout allowedRoles={['student', 'admin']}>
      {/* Your protected content */}
    </RoleProtectedLayout>
  );
}
```

## Security Flow

### Scenario 1: Unauthenticated User Tries to Access Student Dashboard

1. **Middleware** catches the request
2. No valid token found
3. User redirected to `/login?callbackUrl=/dashboard/student`
4. After login, user is redirected back to original URL

### Scenario 2: Landlord Tries to Access Student Dashboard

1. **Middleware** checks user role
2. Role is "landlord", not "student"
3. User redirected to `/dashboard/landlord`
4. Error message shown (optional)

### Scenario 3: Student with Pending Role

1. **Layout** checks user role
2. Role is "pending"
3. User redirected to `/select_role`
4. After role selection, redirected to appropriate dashboard

### Scenario 4: Authenticated Student Accesses Student Dashboard

1. **Middleware** validates token and role ✓
2. **Layout** confirms student role ✓
3. Page content rendered ✓

## Unauthorized Access Page

**File:** `frontend/app/unauthorized/page.js`

### Features:
- User-friendly error message
- Shows user's current role
- Provides navigation options:
  - Go to their correct dashboard
  - Return to home page
  - Sign in (if not authenticated)
- Contact support link

## Protected Routes Summary

### Student Routes (Requires `role: 'student'`)
```
/dashboard/student
/dashboard/student/search
/dashboard/student/bookings
/dashboard/student/bookings/[id]
/dashboard/student/applications
/dashboard/student/messages
/dashboard/student/payments
/dashboard/student/profile
/dashboard/student/community
/dashboard/student/support
/dashboard/student/listing/[id]
```

### Landlord Routes (Requires `role: 'landlord'`)
```
/dashboard/landlord
/dashboard/landlord/*
```

### Agent Routes (Requires `role: 'agent'`)
```
/dashboard/agent
/dashboard/agent/*
```

### Admin Routes (Requires `role: 'admin'`)
```
/dashboard/admin
/dashboard/admin/*
```

## Public Routes (No Authentication Required)

```
/
/login
/register
/forgot-password
/reset-password
/verification
/_next/* (Next.js internal)
/api/auth/* (NextAuth endpoints)
```

## Testing the Security

### Test Case 1: Unauthenticated Access
1. Log out of the application
2. Try to access `/dashboard/student`
3. **Expected:** Redirect to `/login?callbackUrl=/dashboard/student`

### Test Case 2: Wrong Role Access
1. Log in as a landlord
2. Try to access `/dashboard/student`
3. **Expected:** Redirect to `/dashboard/landlord`

### Test Case 3: Pending Role
1. Log in with a user who hasn't selected a role
2. Try to access any dashboard
3. **Expected:** Redirect to `/select_role`

### Test Case 4: Direct URL Access
1. Log in as a student
2. Manually type `/dashboard/landlord` in the browser
3. **Expected:** Redirect to `/dashboard/student`

### Test Case 5: API Token Validation
1. Open browser DevTools
2. Clear NextAuth cookies
3. Try to access protected route
4. **Expected:** Redirect to login

## Security Best Practices Implemented

✅ **Server-side validation** - Middleware runs on server
✅ **Client-side validation** - Layout and component checks
✅ **Token-based authentication** - Uses NextAuth JWT
✅ **Role-based authorization** - Checks user role
✅ **Callback URL preservation** - Seamless post-login redirect
✅ **Loading states** - Better UX during auth checks
✅ **Error handling** - Clear error messages
✅ **Automatic redirects** - Users sent to correct location
✅ **No exposed content** - Protected content never renders for unauthorized users

## Configuration

### NextAuth Configuration
Ensure your NextAuth configuration includes the role in the JWT token:

```javascript
// pages/api/auth/[...nextauth].js
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.role = user.role;
    }
    return token;
  },
  async session({ session, token }) {
    if (session?.user) {
      session.user.role = token.role;
    }
    return session;
  },
}
```

## Maintenance

### Adding New Protected Routes

1. **For new role-based dashboards:**
   - Create a new layout file in `/app/dashboard/[role]/layout.js`
   - Copy the pattern from existing layouts
   - Update middleware.js to include the new role pattern

2. **For individual page protection:**
   - Wrap the page content with `RoleProtectedLayout`
   - Specify allowed roles in the `allowedRoles` prop

3. **For mixed-role access:**
   - Use `RoleProtectedLayout` with multiple roles:
   ```javascript
   <RoleProtectedLayout allowedRoles={['student', 'landlord', 'admin']}>
   ```

## Troubleshooting

### Issue: Infinite redirect loop
**Solution:** Check that the user's role matches the route they're trying to access

### Issue: User can access wrong dashboard
**Solution:** Verify middleware.js is in the root of the frontend directory

### Issue: Loading state never ends
**Solution:** Check NextAuth session configuration and token structure

### Issue: Unauthorized page shows for correct role
**Solution:** Verify the role value in the session matches exactly (case-sensitive)

## Security Checklist

- [x] Middleware protection implemented
- [x] Layout-based protection for all role directories
- [x] Component-level protection available
- [x] Unauthorized access page created
- [x] Loading states implemented
- [x] Callback URLs preserved
- [x] Role validation on server and client
- [x] Token expiration handled
- [x] Error messages user-friendly
- [x] No protected content exposed to unauthorized users

## Additional Security Recommendations

1. **API Route Protection:** Ensure backend API endpoints also validate user roles
2. **Token Refresh:** Implement token refresh mechanism for long sessions
3. **Session Timeout:** Configure appropriate session timeout values
4. **HTTPS Only:** Ensure production uses HTTPS for all requests
5. **Rate Limiting:** Implement rate limiting on authentication endpoints
6. **Audit Logging:** Log unauthorized access attempts
7. **Security Headers:** Configure security headers in next.config.js

## Support

For security concerns or questions, contact the development team or refer to:
- NextAuth.js documentation: https://next-auth.js.org/
- Next.js middleware documentation: https://nextjs.org/docs/app/building-your-application/routing/middleware
