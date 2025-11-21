# Quick Security Guide - Role-Based Access Control

## TL;DR - What Changed?

All student routes (and other role-based routes) are now **automatically protected** with three layers of security. No unauthorized user can access student pages.

## How It Works

### ✅ Automatic Protection (No Code Changes Needed)

All routes under these directories are **automatically protected**:
- `/dashboard/student/*` → Students only
- `/dashboard/landlord/*` → Landlords only  
- `/dashboard/agent/*` → Agents only
- `/dashboard/admin/*` → Admins only

**You don't need to add any protection code to individual pages!**

### 🔒 Three Layers of Security

1. **Middleware** (Server) - Blocks requests before they reach the page
2. **Layout** (Client) - Double-checks on the client side
3. **Component** (Optional) - For granular control

## For Developers

### Creating a New Student Page

Just create the file - it's automatically protected:

```javascript
// frontend/app/dashboard/student/my-new-page/page.js
export default function MyNewPage() {
  return <div>This is automatically protected!</div>;
}
```

No need to add any auth code. The layout handles it.

### Creating a Page Accessible by Multiple Roles

Use the `RoleProtectedLayout` component:

```javascript
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';

export default function SharedPage() {
  return (
    <RoleProtectedLayout allowedRoles={['student', 'landlord']}>
      <div>Both students and landlords can see this</div>
    </RoleProtectedLayout>
  );
}
```

### What Happens When Unauthorized User Tries to Access?

**Scenario 1: Not logged in**
- Redirected to `/login?callbackUrl=/dashboard/student`
- After login, sent back to original page

**Scenario 2: Wrong role (e.g., landlord accessing student page)**
- Redirected to their correct dashboard (`/dashboard/landlord`)

**Scenario 3: Pending role selection**
- Redirected to `/select_role`

## Testing

### Quick Test Commands

```bash
# Test 1: Unauthenticated access
# 1. Log out
# 2. Go to http://localhost:3000/dashboard/student
# Expected: Redirect to login

# Test 2: Wrong role
# 1. Log in as landlord
# 2. Go to http://localhost:3000/dashboard/student  
# Expected: Redirect to /dashboard/landlord

# Test 3: Correct role
# 1. Log in as student
# 2. Go to http://localhost:3000/dashboard/student
# Expected: Page loads successfully
```

## Files Created/Modified

### New Files
- `frontend/middleware.js` - Server-side protection
- `frontend/app/dashboard/student/layout.js` - Student route protection
- `frontend/app/dashboard/landlord/layout.js` - Landlord route protection
- `frontend/app/dashboard/agent/layout.js` - Agent route protection
- `frontend/app/dashboard/admin/layout.js` - Admin route protection
- `frontend/app/unauthorized/page.js` - Unauthorized access page

### Modified Files
- `frontend/components/auth/RoleProtectedLayout.js` - Enhanced with better UX

## Common Questions

**Q: Do I need to add protection to every new student page?**
A: No! Just create the file under `/app/dashboard/student/` and it's automatically protected.

**Q: What if I want a page accessible by multiple roles?**
A: Use `RoleProtectedLayout` with multiple roles in the `allowedRoles` array.

**Q: Can users bypass this protection?**
A: No. The middleware runs on the server before the page loads, so there's no way to bypass it.

**Q: What about API calls?**
A: Make sure your backend API also validates user roles. Frontend protection is not enough.

**Q: How do I test if protection is working?**
A: Try accessing a protected route while logged out or with the wrong role. You should be redirected.

## Security Checklist for New Features

When adding new features:

- [ ] Is it under `/dashboard/[role]/`? → Automatically protected ✅
- [ ] Does it need multiple role access? → Use `RoleProtectedLayout`
- [ ] Does it call APIs? → Ensure backend validates roles too
- [ ] Did you test with different roles? → Test unauthorized access

## Need Help?

- Full documentation: `SECURITY_IMPLEMENTATION.md`
- Issues: Check the troubleshooting section in the full docs
- Questions: Contact the dev team

## Quick Reference

```javascript
// ✅ GOOD - Automatically protected
// frontend/app/dashboard/student/new-feature/page.js
export default function NewFeature() {
  return <div>Content</div>;
}

// ✅ GOOD - Multiple roles
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';

export default function SharedFeature() {
  return (
    <RoleProtectedLayout allowedRoles={['student', 'admin']}>
      <div>Content</div>
    </RoleProtectedLayout>
  );
}

// ❌ BAD - Don't do this (redundant)
// The layout already protects it!
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';

export default function StudentPage() {
  return (
    <RoleProtectedLayout allowedRoles={['student']}>
      {/* This is redundant - layout already protects student routes */}
      <div>Content</div>
    </RoleProtectedLayout>
  );
}
```

## Summary

🎉 **All student routes are now protected!**

- ✅ Middleware blocks unauthorized requests
- ✅ Layouts provide client-side protection  
- ✅ No code changes needed for existing pages
- ✅ New pages are automatically protected
- ✅ Better user experience with proper redirects
- ✅ Clear error messages for unauthorized access

**Just build your features - security is handled automatically!**
