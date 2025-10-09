# Homebase Backend API Endpoints

- /auth/register/ (POST): Register new user (role-based onboarding)
- /auth/login/ (POST): Login (email/password or social)
- /auth/logout/ (POST): Logout
- /auth/activate/ (POST): Email verification
- /auth/password/reset/ (POST): Forgot password
- /auth/password/change/ (POST): Change password
- /users/profile/ (GET/PUT): Profile setup & update
- /verification/docs/ (POST): Upload ID/Docs
- /verification/status/ (GET): Verification progress
- /rbac/roles/ (GET): Role-based access info
- /payments/methods/ (GET/POST): Payment method setup

// Homebase Frontend Pages

- /register (role selection, onboarding)
- /login (email/password, Google, Facebook)
- /dashboard (role-based: student, landlord, agent, admin)
- /profile (photo, preferences, payment)
- /verification (upload docs, progress tracker)
- /forgot-password

## Auth Flow

- JWT-based sessions (NextAuth.js)
- Social login (Google, Facebook)
- 2FA for sensitive roles
- RBAC for dashboard/features

## flow of the project
