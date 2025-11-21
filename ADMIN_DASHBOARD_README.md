# 🎯 Admin Dashboard - Quick Start Guide

## Overview

A complete, production-ready admin dashboard for the HomeBase student housing platform. Manage users, properties, applications, payments, support tickets, and platform settings from one centralized interface.

## ✨ Features

### 📊 Dashboard Overview
- Real-time statistics (users, properties, revenue)
- System alerts and notifications
- Recent activity feed
- Growth indicators

### 👥 User Management
- View all users (students, landlords, agents)
- Change user roles
- Activate/deactivate accounts
- Search and filter users
- User profile details

### 🏠 Property Management
- View all property listings
- Verify/unverify properties
- Change property status
- Filter by status
- View landlord information

### 📝 Application Management
- Review rental applications
- Approve/reject applications
- View student and property details
- Filter by status

### 💰 Payment Management
- View all transactions
- Approve/reject payments
- Filter by status and date range
- Track revenue

### 📈 Reports & Analytics
- User distribution charts
- Property status breakdown
- Revenue trends
- Application statistics
- Exportable data

### 🎧 Support System
- Manage support tickets
- Real-time messaging
- Priority levels
- Status tracking
- Ticket assignment

### ⚙️ Platform Settings
- Configure platform fees
- Set application limits
- Manage notifications
- Automation settings
- Service level agreements

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL or SQLite
- Django project already set up

### Step 1: Run Migrations (1 min)

```bash
cd backend
python manage.py makemigrations admin_api
python manage.py migrate
```

### Step 2: Create Admin User (1 min)

```bash
python manage.py shell < setup_admin.py
```

This creates:
- Admin user: `admin@homebase.com` / `admin123`
- Platform settings with defaults
- Sample support ticket

### Step 3: Start Backend (1 min)

```bash
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

### Step 4: Start Frontend (1 min)

```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:3000`

### Step 5: Login (1 min)

1. Visit: `http://localhost:3000/login`
2. Email: `admin@homebase.com`
3. Password: `admin123`
4. You'll be redirected to: `http://localhost:3000/dashboard/admin`

**🎉 Done! Your admin dashboard is live!**

---

## 📁 Project Structure

```
backend/
├── admin_api/                    # Admin dashboard backend
│   ├── models.py                 # Database models
│   ├── views.py                  # API endpoints
│   ├── serializers.py            # Data serializers
│   ├── permissions.py            # Access control
│   ├── urls.py                   # URL routing
│   ├── utils.py                  # Helper functions
│   └── admin.py                  # Django admin config
├── setup_admin.py                # Quick setup script
└── test_admin_api.py             # API test suite

frontend/
└── app/
    └── dashboard/
        └── admin/                # Admin dashboard frontend
            ├── page.js           # Overview page
            ├── layout.js         # Admin layout
            ├── users/            # User management
            ├── properties/       # Property management
            ├── applications/     # Application management
            ├── payments/         # Payment management
            ├── reports/          # Analytics
            ├── support/          # Support tickets
            └── settings/         # Platform settings
```

---

## 🔌 API Endpoints

All endpoints require admin authentication.

### Authentication
```bash
POST /api/auth/jwt/create/
Body: { "email": "admin@homebase.com", "password": "admin123" }
Response: { "access": "token...", "refresh": "token..." }
```

### Dashboard
```bash
GET /api/admin/dashboard/
Headers: Authorization: Bearer {token}
```

### Users
```bash
GET    /api/admin/users/
GET    /api/admin/users/?role=student
POST   /api/admin/users/{id}/update_role/
POST   /api/admin/users/{id}/toggle_status/
```

### Properties
```bash
GET    /api/admin/properties/
GET    /api/admin/properties/?status=available
POST   /api/admin/properties/{id}/update_status/
POST   /api/admin/properties/{id}/toggle_verification/
```

### Applications
```bash
GET    /api/admin/applications/
PATCH  /api/admin/applications/{id}/
```

### Payments
```bash
GET    /api/admin/payments/
POST   /api/admin/payments/{id}/approve/
POST   /api/admin/payments/{id}/reject/
```

### Reports
```bash
GET    /api/admin/reports/?range=month
```

### Support
```bash
GET    /api/admin/support/tickets/
GET    /api/admin/support/tickets/{id}/
POST   /api/admin/support/tickets/{id}/messages/
POST   /api/admin/support/tickets/{id}/update_status/
```

### Settings
```bash
GET    /api/admin/settings/
PUT    /api/admin/settings/
```

---

## 🧪 Testing

### Run API Tests

```bash
cd backend
python test_admin_api.py
```

### Manual Testing with cURL

```bash
# 1. Get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@homebase.com","password":"admin123"}' \
  | jq -r '.access')

# 2. Test dashboard
curl http://localhost:8000/api/admin/dashboard/ \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Test users list
curl http://localhost:8000/api/admin/users/ \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Test reports
curl http://localhost:8000/api/admin/reports/ \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🔐 Security

### Implemented Security Features

✅ **Role-Based Access Control**
- Only users with `role='admin'` can access admin endpoints
- Enforced at both frontend and backend levels

✅ **JWT Authentication**
- Secure token-based authentication
- Tokens expire after configured time

✅ **Audit Logging**
- All admin actions logged to database
- Tracks: who, what, when, where (IP)
- Immutable logs

✅ **Permission Classes**
- Custom `IsAdminUser` permission
- Applied to all admin endpoints

✅ **IP Tracking**
- Records admin IP address for all actions
- Supports proxy/load balancer setups

### Security Best Practices

1. **Change Default Password**
   ```python
   from django.contrib.auth import get_user_model
   User = get_user_model()
   admin = User.objects.get(email='admin@homebase.com')
   admin.set_password('NewSecurePassword123!')
   admin.save()
   ```

2. **Enable HTTPS in Production**
   ```python
   # settings.py
   SECURE_SSL_REDIRECT = True
   SESSION_COOKIE_SECURE = True
   CSRF_COOKIE_SECURE = True
   ```

3. **Set Strong JWT Settings**
   ```python
   # settings.py
   SIMPLE_JWT = {
       'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
       'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
       'ROTATE_REFRESH_TOKENS': True,
   }
   ```

4. **Regular Audit Log Reviews**
   ```python
   from admin_api.models import AdminActivityLog
   recent_actions = AdminActivityLog.objects.all()[:100]
   ```

---

## 📊 Database Models

### PlatformSettings
Singleton model for platform configuration.

```python
{
    'platform_fee': 5.0,                    # Percentage
    'max_applications_per_student': 5,
    'maintenance_response_time': 24,        # Hours
    'email_notifications': True,
    'sms_notifications': False,
    'auto_approval': False,
    'verification_required': True
}
```

### SupportTicket
Support ticket management.

```python
{
    'user': User,
    'title': 'Ticket title',
    'description': 'Detailed description',
    'status': 'open|in_progress|closed',
    'priority': 'low|medium|high|urgent',
    'assigned_to': Admin User (optional)
}
```

### AdminActivityLog
Audit trail for all admin actions.

```python
{
    'admin': User,
    'action': 'user_role_change',
    'target_model': 'User',
    'target_id': 123,
    'description': 'Changed role from student to landlord',
    'metadata': {},
    'ip_address': '192.168.1.1',
    'created_at': datetime
}
```

---

## 🎨 Customization

### Change Platform Branding

Edit `frontend/app/dashboard/admin/page.js`:
```javascript
<h1 className="text-3xl font-bold">Your Company Admin</h1>
```

### Add Custom Metrics

Edit `backend/admin_api/views.py` in `dashboard_overview`:
```python
stats['customMetric'] = calculate_custom_metric()
```

### Add New Admin Pages

1. Create new page: `frontend/app/dashboard/admin/newpage/page.js`
2. Add to sidebar: `frontend/app/dashboard/admin/page.js`
3. Create backend endpoint: `backend/admin_api/views.py`
4. Add URL route: `backend/admin_api/urls.py`

---

## 🐛 Troubleshooting

### Issue: "admin_api not found"
```bash
# Ensure app is in INSTALLED_APPS
# backend/homebase_backend/settings.py
INSTALLED_APPS = [
    ...
    'admin_api',
]
```

### Issue: "Permission denied"
```bash
# Check user role
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.get(email='admin@homebase.com')
>>> user.role
'admin'  # Should be 'admin'
```

### Issue: "CORS errors"
```python
# backend/homebase_backend/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### Issue: "Token expired"
```bash
# Login again to get new token
curl -X POST http://localhost:8000/api/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@homebase.com","password":"admin123"}'
```

---

## 📈 Performance Tips

### Enable Database Indexes
Already implemented in models. Verify with:
```bash
python manage.py sqlmigrate admin_api 0001
```

### Add Caching (Optional)
```python
# Install Redis
pip install django-redis

# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}

# Cache dashboard stats for 5 minutes
from django.core.cache import cache
stats = cache.get('dashboard_stats')
if not stats:
    stats = calculate_stats()
    cache.set('dashboard_stats', stats, 300)
```

### Pagination
Add to views:
```python
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100
```

---

## 🚀 Production Deployment

### 1. Environment Variables
```bash
# .env
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@host:5432/db
ALLOWED_HOSTS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### 2. Static Files
```bash
python manage.py collectstatic
```

### 3. Database
```bash
python manage.py migrate
python manage.py shell < setup_admin.py
```

### 4. Web Server
Use Gunicorn + Nginx:
```bash
pip install gunicorn
gunicorn homebase_backend.wsgi:application --bind 0.0.0.0:8000
```

### 5. Process Manager
Use systemd or supervisor to keep server running.

---

## 📞 Support & Documentation

- **Full Implementation Guide**: `ADMIN_DASHBOARD_IMPLEMENTATION_COMPLETE.md`
- **Analysis Document**: `ADMIN_DASHBOARD_ANALYSIS.md`
- **API Tests**: `backend/test_admin_api.py`
- **Setup Script**: `backend/setup_admin.py`

---

## 🎉 Success!

Your admin dashboard is now fully operational with:

✅ 8 major feature areas
✅ 20+ API endpoints
✅ Complete security implementation
✅ Audit logging
✅ Modern, responsive UI
✅ Real-time updates
✅ Comprehensive documentation

**Next Steps:**
1. Change default admin password
2. Customize branding
3. Add your team members as admins
4. Configure platform settings
5. Start managing your platform!

---

**Built with ❤️ for HomeBase Student Housing Platform**
