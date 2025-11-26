from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Student, Landlord, Agent

User = get_user_model()


class Command(BaseCommand):
    help = 'Test automatic profile creation'

    def handle(self, *args, **options):
        self.stdout.write("Testing automatic profile creation...")
        
        # Test creating a student user
        self.stdout.write("Creating student user...")
        test_user = User.objects.create_user(
            email='test.student.auto@example.com',
            password='testpass123',
            first_name='Test',
            last_name='Student',
            role='student'
        )
        
        # Check if profile was created
        if hasattr(test_user, 'student'):
            self.stdout.write(self.style.SUCCESS('✓ Student profile created automatically!'))
        else:
            self.stdout.write(self.style.ERROR('✗ Student profile NOT created'))
        
        # Clean up
        test_user.delete()
        self.stdout.write("Test user deleted")
        
        self.stdout.write(self.style.SUCCESS('Test completed!'))