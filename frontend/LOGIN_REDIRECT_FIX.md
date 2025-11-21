# Login Redirect Fix

## Issue
When users tried to access protected routes (e.g., `/dashboard/student/search`), they were being redirected to NextAuth's default signin page (`/api/auth/signin`) instead of the custom `/login` page.

## Root Cause
1. NextAuth was not configured to use custom pages
2. LoginForm component was hardcoding the callbackUrl to `/dashboard`
3. Middleware wasn't explicitly specifying the custom signin page

## Solution

### 1. Updated NextAuth Configuration
**File:** `frontend/app/api/auth/[...nextauth]/route.js`

Added `pages` configuration to tell NextAuth to use custom pages:

```javascript
const config = {
  pages: {
    signIn: '/login',           // Custom login page
    signOut: '/login',          // Redirect after logout
    error: '/login',            // Error page
    verifyRequest: '/verification', // Email verification
    newUser: '/select_role',    // New user onboarding
  },
  // ... rest of config
};
```

### 2. Updated Middleware
**File:** `frontend/middleware.js`

Added explicit page configuration to the middleware:

```javascript
export default withAuth(
  // ... middleware function
  {
    callbacks: {
      // ... callbacks
    },
    pages: {
      signIn: '/login',  // Tell middleware to use custom login page
    },
  }
);
```

Also added `/select_role` to the list of public routes.

### 3. Updated LoginForm Component
**File:** `frontend/components/LoginForm.js`

Changed the component to:
- Read the `callbackUrl` from URL query parameters
- Use that URL for redirects after successful login
- Default to `/dashboard` if no callbackUrl is provided

```javascript
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  // Use callbackUrl in signIn calls
  const result = await signIn("credentials", {
    redirect: false,
    email: form.email,
    password: form.password,
    callbackUrl: callbackUrl,  // Now uses the actual callback URL
  });
  
  if (result?.ok) {
    router.push(callbackUrl);  // Redirect to original destination
  }
}
```

## How It Works Now

### Scenario 1: User tries to access protected route while logged out

```
1. User navigates to: /dashboard/student/search?location=kilifi
2. Middleware detects no authentication
3. User redirected to: /login?callbackUrl=/dashboard/student/search?location=kilifi
4. User logs in successfully
5. User redirected back to: /dashboard/student/search?location=kilifi
```

### Scenario 2: User clicks login from homepage

```
1. User clicks "Sign In" button
2. Navigates to: /login
3. No callbackUrl in URL
4. User logs in successfully
5. User redirected to: /dashboard (default)
6. Dashboard redirects to role-specific dashboard
```

### Scenario 3: User with wrong role tries to access protected route

```
1. Landlord tries to access: /dashboard/student
2. Middleware detects wrong role
3. User redirected to: /dashboard/landlord (their correct dashboard)
4. No login required (already authenticated)
```

## Testing

### Test 1: Callback URL Preservation ✅
```bash
1. Log out
2. Navigate to: http://localhost:3000/dashboard/student/search?location=kilifi
3. Expected: Redirect to /login?callbackUrl=/dashboard/student/search?location=kilifi
4. Log in
5. Expected: Redirect back to /dashboard/student/search?location=kilifi
```

### Test 2: Direct Login ✅
```bash
1. Navigate to: http://localhost:3000/login
2. Log in
3. Expected: Redirect to /dashboard (then to role-specific dashboard)
```

### Test 3: Social Login with Callback ✅
```bash
1. Log out
2. Navigate to protected route
3. Redirected to /login with callbackUrl
4. Click "Sign in with Google"
5. Expected: After OAuth, redirect to original destination
```

## Files Modified

1. ✅ `frontend/app/api/auth/[...nextauth]/route.js` - Added pages config
2. ✅ `frontend/middleware.js` - Added pages config and /select_role route
3. ✅ `frontend/components/LoginForm.js` - Added callbackUrl handling

## Benefits

✅ **Seamless UX** - Users return to where they wanted to go
✅ **Custom branding** - Uses your custom login page, not NextAuth default
✅ **Query params preserved** - Search filters and other params maintained
✅ **Works with social login** - OAuth flows also respect callback URLs
✅ **Consistent behavior** - All auth flows use the same custom pages

## Additional Notes

### NextAuth Pages Configuration

The `pages` object in NextAuth config controls which custom pages to use:

- `signIn` - Where to redirect for login
- `signOut` - Where to redirect after logout
- `error` - Where to show auth errors
- `verifyRequest` - Email verification page
- `newUser` - New user onboarding

### URL Encoding

The callbackUrl is automatically URL-encoded by NextAuth, so complex URLs with query parameters work correctly:

```
Original: /dashboard/student/search?location=kilifi&type=apartment
Encoded: /login?callbackUrl=%2Fdashboard%2Fstudent%2Fsearch%3Flocation%3Dkilifi%26type%3Dapartment
```

The `useSearchParams()` hook automatically decodes this.

## Troubleshooting

### Issue: Still redirecting to /api/auth/signin
**Solution:** Clear browser cache and cookies, restart Next.js dev server

### Issue: Callback URL not working
**Solution:** Check that `useSearchParams()` is imported from `next/navigation`, not `next/router`

### Issue: Query parameters lost after login
**Solution:** Ensure the entire URL including query params is in the callbackUrl

## Summary

The login redirect now works correctly:
- ✅ Uses custom `/login` page instead of NextAuth default
- ✅ Preserves the original destination URL
- ✅ Maintains query parameters
- ✅ Works with both credentials and social login
- ✅ Provides seamless user experience

Users will now be redirected to your custom login page and returned to their original destination after successful authentication.
