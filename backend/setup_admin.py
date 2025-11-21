"""
Quick setup script for Admin Dashboard
Run with: python manage.py shell < setup_admin.py
"""

from django.contrib.auth import get_user_model
from admin_api.models import PlatformSettings
from support.models import SupportTicket, SupportMessage

User = get_user_model()

print("=" * 60)
print("ADMIN DASHBOARD SETUP")
print("=" * 60)

# Step 1: Create admin user if doesn't exist
print("\n[1/3] Creating admin user...")
admin_email = "admin@homebase.com"
admin_password = "admin123"  # Change this in production!

if User.objects.filter(email=admin_email).exists():
    admin = User.objects.get(email=admin_email)
    print(f"✓ Admin user already exists: {admin_email}")
else:
    admin = User.objects.create_user(
        email=admin_email,
        password=admin_password,
        first_name="Admin",
        last_name="User",
        role="admin",
        is_staff=True,
        is_active=True
    )
    print(f"✓ Admin user created: {admin_email}")
    print(f"  Password: {admin_password}")
    print(f"  ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!")

# Step 2: Initialize platform settings
print("\n[2/3] Initializing platform settings...")
settings = PlatformSettings.load()
print(f"✓ Platform settings initialized")
print(f"  Platform Fee: {settings.platform_fee}%")
print(f"  Max Applications: {settings.max_applications_per_student}")
print(f"  Email Notifications: {settings.email_notifications}")

# Step 3: Create sample support ticket (optional)
print("\n[3/3] Creating sample data...")
if not SupportTicket.objects.exists():
    # Create a test student user if needed
    if not User.objects.filter(role='student').exists():
        test_student = User.objects.create_user(
            email="student@test.com",
            password="student123",
            first_name="Test",
            last_name="Student",
            role="student",
            is_active=True
        )
        print(f"✓ Test student created: student@test.com")
    else:
        test_student = User.objects.filter(role='student').first()
    
    # Create sample ticket
    ticket = SupportTicket.objects.create(
        user=test_student,
        title="Sample Support Ticket",
        description="This is a test ticket to demonstrate the support system.",
        status="open",
        priority="medium"
    )
    
    # Add a message
    SupportMessage.objects.create(
        ticket=ticket,
        sender='student',
        content="I need help with my account."
    )
    
    print(f"✓ Sample support ticket created")
else:
    print(f"✓ Support tickets already exist")

print("\n" + "=" * 60)
print("SETUP COMPLETE!")
print("=" * 60)
print("\nYou can now:")
print(f"1. Login to admin dashboard with: {admin_email}")
print(f"2. Visit: http://localhost:3000/dashboard/admin")
print(f"3. Test API at: http://localhost:8000/api/admin/")
print("\nTo get JWT token:")
print(f"  POST http://localhost:8000/api/auth/jwt/create/")
print(f"  Body: {{'email': '{admin_email}', 'password': '{admin_password}'}}")
print("\n" + "=" * 60)
