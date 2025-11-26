from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Student, Landlord, Agent

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create user profile when user role is set
    """
    # Skip if user is being created for the first time or role is admin/pending
    if instance.role in ['admin', 'pending']:
        return
    
    # Create appropriate profile based on role
    if instance.role == 'student':
        # Check if student profile already exists
        if not hasattr(instance, 'student'):
            Student.objects.get_or_create(
                user=instance,
                defaults={
                    'university': 'Not specified',
                    'student_id': ''
                }
            )
    
    elif instance.role == 'landlord':
        # Check if landlord profile already exists
        if not hasattr(instance, 'landlord'):
            Landlord.objects.get_or_create(
                user=instance,
                defaults={
                    'national_id': 'Not specified'
                }
            )
    
    elif instance.role == 'agent':
        # Check if agent profile already exists
        if not hasattr(instance, 'agent'):
            Agent.objects.get_or_create(
                user=instance,
                defaults={
                    'national_id': 'Not specified',
                    'campus_region': 'Not specified'
                }
            )


@receiver(post_save, sender=User)
def handle_role_change(sender, instance, created, **kwargs):
    """
    Handle role changes - clean up old profiles and create new ones
    """
    if created:
        return  # Skip for new users, handled by create_user_profile
    
    # If role changed, we need to clean up old profiles
    # Note: This is a simple approach. In production, you might want to 
    # preserve old profile data or handle transitions differently
    
    if instance.role == 'student' and not hasattr(instance, 'student'):
        # Clean up other profiles if they exist
        if hasattr(instance, 'landlord'):
            instance.landlord.delete()
        if hasattr(instance, 'agent'):
            instance.agent.delete()
        
        # Create student profile
        Student.objects.get_or_create(
            user=instance,
            defaults={
                'university': 'Not specified',
                'student_id': ''
            }
        )
    
    elif instance.role == 'landlord' and not hasattr(instance, 'landlord'):
        # Clean up other profiles if they exist
        if hasattr(instance, 'student'):
            instance.student.delete()
        if hasattr(instance, 'agent'):
            instance.agent.delete()
        
        # Create landlord profile
        Landlord.objects.get_or_create(
            user=instance,
            defaults={
                'national_id': 'Not specified'
            }
        )
    
    elif instance.role == 'agent' and not hasattr(instance, 'agent'):
        # Clean up other profiles if they exist
        if hasattr(instance, 'student'):
            instance.student.delete()
        if hasattr(instance, 'landlord'):
            instance.landlord.delete()
        
        # Create agent profile
        Agent.objects.get_or_create(
            user=instance,
            defaults={
                'national_id': 'Not specified',
                'campus_region': 'Not specified'
            }
        )