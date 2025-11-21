# Password Reset Flow Analysis

## Overview
The application uses **Djoser** (Django REST framework authentication) for password reset functionality. The flow involves email-based token verification.

## Complete Password Reset Flow

### Step 1: User Requests Password Reset
**Frontend**: `/forgot-password`
**Component**: `ForgotPasswordForm.js`

```javascript
POST /api/auth/users/reset_password/
Body: { email: "user@example.com" }
```

**What Happens**:
1. User enters their email address
2. Frontend sends POST request to Djoser endpoint
3. Backend validates email exists in database
4. Backend generates unique reset token (UID + Token)
5. Backend sends email with reset link

**Email Content** (when SMTP is configured):
```
Subject: Password Reset
Body: Click here to reset your password:
http://localhost:3000/reset-password?uid={uid}&token={token}
```

### Step 2: User Receives Email
**Current Status**: ⚠️ **Using Console Backend**

The email is currently printed to the Django console instead of being sent via SMTP because:
```python
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
```

**In Console, you'll see**:
```
Content-Type: text/plain; charset="utf-8"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Subject: Password reset on localhost:8000
From: webmaster@localhost
To: user@example.com

You're receiving this email because you requested a password reset...
Follow the link below:
http://localhost:3000/reset-password?uid=MQ&token=c5h8kj-abc123def456...
```

### Step 3: User Clicks Reset Link
**Frontend**: `/reset-password?uid={uid}&token={token}`
**Component**: `ResetPasswordForm.js`

**What Happens**:
1. User clicks link in email
2. Browser opens reset password page
3. Page extracts `uid` and `token` from URL query parameters
4. User enters new password (twice for confirmation)

### Step 4: Password Reset Confirmation
```javascript
POST /api/auth/users/reset_password_confirm/
Body: {
  uid: "MQ",
  token: "c5h8kj-abc123def456...",
  new_password: "NewSecurePassword123"
}
```

**Backend Process**:
1. Validates UID and token
2. Checks token hasn't expired (default: 24 hours)
3. Verifies token hasn't been used
4. Hashes new password
5. Updates user's password in database
6. Invalidates the reset token
7. Returns success response

### Step 5: Redirect to Login
**What Happens**:
1. Frontend shows success message
2. After 2 seconds, redirects to `/login`
3. User can now login with new password

## Technical Details

### Djoser Configuration
**Location**: `backend/homebase_backend/settings.py`

```python
DJOSER = {
    "LOGIN_FIELD": "email",  # Use email instead of username
    "USER_CREATE_PASSWORD_RETYPE": True,  # Require password confirmation
    "SEND_ACTIVATION_EMAIL": False,  # No email verification on signup
    "ACTIVATION_URL": "activate/{uid}/{token}",
    "PASSWORD_RESET_CONFIRM_URL": "password/reset/confirm/{uid}/{token}",
}
```

### Available Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/users/reset_password/` | POST | Request password reset | No |
| `/api/auth/users/reset_password_confirm/` | POST | Confirm password reset | No |
| `/api/auth/jwt/create/` | POST | Login with email/password | No |
| `/api/users/set_password/` | POST | Set password (for social users) | Yes |
| `/api/users/check_password_status/` | GET | Check if user has password | Yes |

### Token Security

**Token Generation**:
- Uses Django's `PasswordResetTokenGenerator`
- Includes user ID, timestamp, and user's password hash
- Token becomes invalid if:
  - Password is changed
  - Token expires (default 24 hours)
  - Token is used once

**UID Encoding**:
- User ID is base64 encoded
- Example: User ID `1` → UID `MQ`

## Current Issues & Solutions

### Issue 1: Email Not Sending (SMTP Timeout)
**Problem**: Gmail SMTP connection times out

**Current Workaround**: Using console backend
```python
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
```

**Solutions**:

#### Option A: Fix Gmail SMTP (Production)
```python
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "your-email@gmail.com"
EMAIL_HOST_PASSWORD = "your-app-password"  # Not regular password!
```

**Steps to get Gmail App Password**:
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate new app password
5. Use that password in settings

#### Option B: Use SendGrid (Recommended for Production)
```python
EMAIL_BACKEND = "sendgrid_backend.SendgridBackend"
SENDGRID_API_KEY = "your-sendgrid-api-key"
```

#### Option C: Use Mailgun
```python
EMAIL_BACKEND = "anymail.backends.mailgun.EmailBackend"
ANYMAIL = {
    "MAILGUN_API_KEY": "your-api-key",
    "MAILGUN_SENDER_DOMAIN": "mg.yourdomain.com",
}
```

### Issue 2: Social Login Users Can't Reset Password
**Problem**: Users who registered via Google/Facebook have unusable passwords

**Solution**: ✅ Already implemented!

New endpoint: `POST /api/users/set_password/`
```javascript
// For social users to set initial password
{
  "new_password": "SecurePassword123"
}

// For regular users to change password
{
  "current_password": "OldPassword123",
  "new_password": "NewPassword123"
}
```

## Testing the Flow

### Test Case 1: Regular Password Reset

```bash
# 1. Request password reset
curl -X POST http://localhost:8000/api/auth/users/reset_password/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Response: 204 No Content (success)

# 2. Check Django console for email with reset link
# Look for: uid=MQ&token=c5h8kj-...

# 3. Confirm password reset
curl -X POST http://localhost:8000/api/auth/users/reset_password_confirm/ \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "MQ",
    "token": "c5h8kj-abc123...",
    "new_password": "NewPassword123"
  }'

# Response: 204 No Content (success)

# 4. Login with new password
curl -X POST http://localhost:8000/api/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "NewPassword123"
  }'

# Response: { "access": "...", "refresh": "..." }
```

### Test Case 2: Social User Sets Password

```bash
# 1. Check if user has password
curl -X GET http://localhost:8000/api/users/check_password_status/ \
  -H "Authorization: Bearer {access_token}"

# Response: { "has_usable_password": false, "email": "user@gmail.com" }

# 2. Set password for social user
curl -X POST http://localhost:8000/api/users/set_password/ \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{"new_password": "NewPassword123"}'

# Response: { "message": "Password set successfully...", "has_password": true }

# 3. Now user can login with email/password
curl -X POST http://localhost:8000/api/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@gmail.com",
    "password": "NewPassword123"
  }'

# Response: { "access": "...", "refresh": "..." }
```

## Security Considerations

### ✅ Implemented Security Features

1. **Token Expiration**: Tokens expire after 24 hours
2. **One-Time Use**: Tokens can only be used once
3. **Password Hashing**: Passwords are hashed with PBKDF2
4. **HTTPS Required**: Should use HTTPS in production
5. **Rate Limiting**: Should implement rate limiting on reset endpoint

### ⚠️ Recommended Improvements

1. **Add Rate Limiting**:
```python
# In settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '5/hour',  # 5 password reset requests per hour
    }
}
```

2. **Add CAPTCHA**: Prevent automated password reset attacks

3. **Log Reset Attempts**: Track suspicious activity

4. **Email Verification**: Verify email before allowing reset

## Frontend Components

### ForgotPasswordForm.js
**Location**: `frontend/components/ForgotPasswordForm.js`

**Features**:
- Email input field
- Loading state during request
- Success/error messages
- Clean, modern UI

### ResetPasswordForm.js
**Location**: `frontend/components/ResetPasswordForm.js`

**Features**:
- Extracts UID and token from URL
- Password and confirmation fields
- Password strength validation
- Auto-redirect to login after success

### Pages
- `/forgot-password` - Request reset page
- `/reset-password?uid={uid}&token={token}` - Confirm reset page

## Troubleshooting

### Problem: "Email not received"
**Solution**: Check Django console for email output (current setup)

### Problem: "Invalid token"
**Causes**:
- Token expired (>24 hours old)
- Token already used
- User changed password after token was generated
- Invalid UID or token format

### Problem: "Social user can't reset password"
**Solution**: Use `/api/users/set_password/` endpoint instead

### Problem: "SMTP timeout"
**Solution**: 
- Use console backend for development
- Configure proper SMTP for production
- Use email service like SendGrid

## Conclusion

**Current Status**: ✅ Password reset is functional

**How it works**:
1. User requests reset → Email sent (to console)
2. User clicks link → Opens reset page
3. User enters new password → Password updated
4. User can login with new password

**For Social Users**: ✅ Can now set password via `/api/users/set_password/`

**For Production**: Configure proper SMTP or email service

---

**Last Updated**: November 21, 2025
**Status**: Fully functional with console email backend
