# Social Login vs Email/Password Authentication Analysis

## Current Implementation

### Social Login Flow
**Endpoint**: `POST /api/users/social_login/`

**What Happens**:
1. User authenticates with Google/Facebook
2. Frontend sends user data (email, name, provider) to backend
3. Backend creates or retrieves user by email
4. **Critical**: If user is new, password is set to **UNUSABLE**
   ```python
   if created:
       user.set_unusable_password()
       user.save()
   ```
5. JWT tokens are generated and returned

### Regular Login Flow
**Endpoint**: `POST /api/auth/jwt/create/` (Djoser)

**What Happens**:
1. User submits email and password
2. Django authenticates using `check_password()`
3. If password matches, JWT tokens are generated
4. If password is unusable, authentication **FAILS**

## The Problem

### ❌ Users who register via social media CANNOT login with email/password

**Reason**: When a user registers through social login, their password is set to unusable:
```python
user.set_unusable_password()
```

This means:
- `user.has_usable_password()` returns `False`
- `user.check_password(any_password)` always returns `False`
- Regular email/password login will **always fail**

### Example Scenario

1. **User registers with Google**:
   - Email: `john@gmail.com`
   - Password: `!` (unusable marker)
   - Can login: ✅ Via Google only

2. **User tries to login with email/password**:
   - Email: `john@gmail.com`
   - Password: `any_password`
   - Result: ❌ **Authentication failed**

## Why This Design?

This is actually a **security best practice**:

1. **No Password Leaks**: Social login users never set a password, so there's nothing to leak
2. **Single Source of Truth**: Authentication is delegated to Google/Facebook
3. **No Password Reset Issues**: Can't reset what doesn't exist
4. **Prevents Account Takeover**: Attacker can't bypass social auth by setting a password

## Current Behavior Summary

| Registration Method | Can Login with Email/Password? | Can Login with Social? |
|--------------------|---------------------------------|------------------------|
| Email/Password     | ✅ Yes                          | ❌ No (unless linked)  |
| Google OAuth       | ❌ No                           | ✅ Yes (Google only)   |
| Facebook OAuth     | ❌ No                           | ✅ Yes (Facebook only) |

## Solutions

### Option 1: Keep Current Behavior (Recommended)
**Status**: ✅ Already implemented

**Pros**:
- More secure
- Industry standard
- Prevents password-related vulnerabilities
- Clear separation of authentication methods

**Cons**:
- Users must remember which method they used
- Can't switch between methods easily

**User Experience**:
- Show "Continue with Google" button if user registered with Google
- Display error: "This account uses Google login. Please sign in with Google."

### Option 2: Allow Password Setting for Social Users
**Status**: ❌ Not implemented

**Implementation**:
```python
# Add endpoint to set password for social users
@action(detail=False, methods=['post'])
def set_password_for_social_user(self, request):
    user = request.user
    if user.has_usable_password():
        return Response({'error': 'Password already set'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    password = request.data.get('password')
    user.set_password(password)
    user.save()
    return Response({'message': 'Password set successfully'})
```

**Pros**:
- Users can switch between login methods
- More flexible

**Cons**:
- Less secure (two attack vectors)
- Confusing for users
- Password reset complexity

### Option 3: Account Linking
**Status**: ❌ Not implemented

**Implementation**:
- Allow users to link multiple authentication methods
- Store provider information in database
- User can login with any linked method

**Pros**:
- Best user experience
- Maximum flexibility
- Can use any linked method

**Cons**:
- Complex implementation
- Requires additional database tables
- More maintenance

## Recommendations

### For Current Implementation: ✅ Keep as is

**Improve User Experience**:

1. **Frontend Detection**:
   ```javascript
   // When login fails, check if user exists with social auth
   if (loginError && loginError.includes('Invalid credentials')) {
     const provider = await checkUserProvider(email);
     if (provider) {
       showError(`This account uses ${provider} login. Please sign in with ${provider}.`);
     }
   }
   ```

2. **Add Provider Indicator**:
   - Store provider in user model
   - Show appropriate login button on login page
   - "Continue with Google" if user registered with Google

3. **Clear Messaging**:
   - Registration: "By signing up with Google, you'll use Google to sign in"
   - Login: "Sign in the same way you registered"

### For Future Enhancement: Account Linking

If you want to allow both methods:

1. **Add Provider Model**:
   ```python
   class SocialProvider(models.Model):
       user = models.ForeignKey(User, on_delete=models.CASCADE)
       provider = models.CharField(max_length=50)  # google, facebook, email
       provider_id = models.CharField(max_length=255)
       created_at = models.DateTimeField(auto_now_add=True)
   ```

2. **Update Social Login**:
   - Don't set unusable password
   - Create provider record
   - Allow password setting later

3. **Add Account Settings**:
   - Show linked providers
   - Allow adding/removing providers
   - Require at least one active method

## Testing

### Test Case 1: Social Registration → Email Login
```bash
# 1. Register with Google
POST /api/users/social_login/
{
  "email": "test@gmail.com",
  "provider": "google"
}
# Result: ✅ Success, user created

# 2. Try to login with email/password
POST /api/auth/jwt/create/
{
  "email": "test@gmail.com",
  "password": "any_password"
}
# Result: ❌ Fails (expected behavior)
```

### Test Case 2: Email Registration → Social Login
```bash
# 1. Register with email/password
POST /api/auth/users/
{
  "email": "test@gmail.com",
  "password": "SecurePass123"
}
# Result: ✅ Success

# 2. Try to login with Google (same email)
POST /api/users/social_login/
{
  "email": "test@gmail.com",
  "provider": "google"
}
# Result: ✅ Success (gets existing user)
# Note: User can now login with BOTH methods
```

## Conclusion

**Current Status**: ✅ Working as designed

**Answer to Your Question**:
> "Can a user who registers with social media login with email/password?"

**NO** - This is intentional and secure. Users who register via social login:
- ❌ Cannot login with email/password
- ✅ Must use the same social provider they registered with
- ✅ This is a security best practice

**Recommendation**: Keep current implementation and improve frontend messaging to guide users to the correct login method.

---

**Last Updated**: November 21, 2025
**Status**: Analyzed and documented
