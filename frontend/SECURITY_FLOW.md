# Security Flow Diagram

## Request Flow for Protected Routes

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Requests Protected Route                │
│                  (e.g., /dashboard/student)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: MIDDLEWARE                           │
│                    (Server-Side Check)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Is user authenticated?                                    │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                  │
│        NO ────┼──── YES                                          │
│               │      │                                           │
│               │      ▼                                           │
│               │  ┌──────────────────────────────────────────┐   │
│               │  │ Does user role match route?              │   │
│               │  └────────┬─────────────────────────────────┘   │
│               │           │                                      │
│               │    NO ────┼──── YES                              │
│               │           │      │                               │
│               ▼           ▼      │                               │
│         Redirect to   Redirect   │                               │
│         /login        to correct │                               │
│                       dashboard  │                               │
└───────────────────────────────────┼──────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 2: LAYOUT                               │
│                    (Client-Side Check)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ useSession() - Check authentication status                │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                  │
│        Loading ──┬── Unauthenticated ──┬── Authenticated        │
│               │  │                      │                        │
│               ▼  ▼                      ▼                        │
│         Show    Redirect to      ┌──────────────────────────┐   │
│         Spinner /login           │ Is role correct?         │   │
│                                  └────────┬─────────────────┘   │
│                                           │                      │
│                                    NO ────┼──── YES              │
│                                           │      │               │
│                                           ▼      │               │
│                                      Redirect    │               │
│                                      to correct  │               │
│                                      dashboard   │               │
└───────────────────────────────────────────────────┼──────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 3: COMPONENT                            │
│                    (Optional - For Granular Control)             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ RoleProtectedLayout - Check if user role in allowedRoles │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                  │
│        NO ────┼──── YES                                          │
│               │      │                                           │
│               ▼      ▼                                           │
│         Redirect   Render                                        │
│         to         Protected                                     │
│         /unauthorized Content                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Example Scenarios

### Scenario A: Unauthenticated User → Student Dashboard

```
User navigates to: /dashboard/student
                    │
                    ▼
         ┌──────────────────────┐
         │   MIDDLEWARE CHECK   │
         │  No valid token      │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Redirect to:        │
         │  /login?callbackUrl= │
         │  /dashboard/student  │
         └──────────────────────┘
```

### Scenario B: Landlord → Student Dashboard

```
Landlord navigates to: /dashboard/student
                        │
                        ▼
            ┌──────────────────────┐
            │   MIDDLEWARE CHECK   │
            │  Token valid ✓       │
            │  Role: landlord      │
            │  Required: student   │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Redirect to:        │
            │  /dashboard/landlord │
            └──────────────────────┘
```

### Scenario C: Student → Student Dashboard (Success)

```
Student navigates to: /dashboard/student
                       │
                       ▼
           ┌──────────────────────┐
           │   MIDDLEWARE CHECK   │
           │  Token valid ✓       │
           │  Role: student ✓     │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │    LAYOUT CHECK      │
           │  Session valid ✓     │
           │  Role: student ✓     │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │   RENDER PAGE ✓      │
           │  Content displayed   │
           └──────────────────────┘
```

### Scenario D: Pending Role User → Any Dashboard

```
User with pending role navigates to: /dashboard/student
                                      │
                                      ▼
                          ┌──────────────────────┐
                          │   MIDDLEWARE CHECK   │
                          │  Token valid ✓       │
                          │  Role: pending       │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │  Redirect to:        │
                          │  /select_role        │
                          └──────────────────────┘
```

## Security Layers Comparison

| Layer | Location | When | Purpose | Can Bypass? |
|-------|----------|------|---------|-------------|
| **Middleware** | Server | Before page loads | Block unauthorized requests | ❌ No |
| **Layout** | Client | During page render | Double-check + UX | ❌ No |
| **Component** | Client | Component mount | Granular control | ❌ No |

## Protection Coverage

```
┌─────────────────────────────────────────────────────────┐
│                    Application Routes                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  PUBLIC (No Protection)                                  │
│  ├── /                                                   │
│  ├── /login                                              │
│  ├── /register                                           │
│  └── /forgot-password                                    │
│                                                          │
│  PROTECTED (Middleware + Layout)                         │
│  ├── /dashboard/student/*     [Student Only]            │
│  ├── /dashboard/landlord/*    [Landlord Only]           │
│  ├── /dashboard/agent/*       [Agent Only]              │
│  └── /dashboard/admin/*       [Admin Only]              │
│                                                          │
│  PROTECTED (Component-level)                             │
│  └── Custom pages with RoleProtectedLayout              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Authentication State Machine

```
┌─────────────┐
│ Unauthenticated │
└──────┬──────┘
       │ Login
       ▼
┌─────────────┐
│ Authenticated│
│ (Pending)   │
└──────┬──────┘
       │ Select Role
       ▼
┌─────────────┐
│ Authenticated│
│ (With Role) │
└──────┬──────┘
       │
       ├─── Student ──→ /dashboard/student
       ├─── Landlord ─→ /dashboard/landlord
       ├─── Agent ────→ /dashboard/agent
       └─── Admin ────→ /dashboard/admin
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Access Denied                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  What's the reason?  │
          └──────────┬───────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│Not Logged│  │Wrong Role│  │ Pending  │
│   In     │  │          │  │   Role   │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│Redirect  │  │Redirect  │  │Redirect  │
│to /login │  │to correct│  │to select │
│          │  │dashboard │  │_role     │
└──────────┘  └──────────┘  └──────────┘
```

## Session Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    User Journey                          │
└─────────────────────────────────────────────────────────┘

1. User visits site
   └─→ No session → Public pages only

2. User logs in
   └─→ Session created → Token issued

3. User selects role (if pending)
   └─→ Role added to token

4. User navigates to dashboard
   └─→ Middleware validates token + role
   └─→ Layout confirms access
   └─→ Page renders

5. User tries to access wrong dashboard
   └─→ Middleware redirects to correct dashboard

6. Session expires
   └─→ Middleware redirects to login
   └─→ Callback URL preserved

7. User logs out
   └─→ Session destroyed
   └─→ Redirected to home
```

## Quick Decision Tree

```
Need to protect a page?
│
├─ Is it under /dashboard/[role]/?
│  └─ YES → Already protected! ✅
│
└─ NO → Need multiple roles?
   │
   ├─ YES → Use RoleProtectedLayout
   │         with allowedRoles array
   │
   └─ NO → Create new role directory
            with layout.js
```

## Summary

- **3 Layers** of protection (Middleware, Layout, Component)
- **Server-side** validation prevents bypassing
- **Client-side** validation provides better UX
- **Automatic** protection for role-based directories
- **Flexible** component-level protection available
- **Seamless** redirects with callback URLs
- **Clear** error messages for users
