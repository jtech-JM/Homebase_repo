"""
Management command to sync existing profile data with verification system.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User
from profiles.models import Profile
from verification.enhanced_models import StudentVerification


class Command(BaseCommand):
    help = 'Sync existing profile data (avatar, phone, address) with verification system'

    def handle(self, *args, **options):
        self.stdout.write('Starting profile verification sync...\n')
        
        students = User.objects.filter(role='student')
        synced_count = 0
        
        for user in students:
            try:
                profile = Profile.objects.get(user=user)
                student_verification, created = StudentVerification.objects.get_or_create(
                    user=user,
                    defaults={
                        'university': profile.major or 'Unknown',
                        'verification_score': 0,
                    }
                )
                
                score_updated = False
                changes = []
                
                # Check avatar
                if profile.avatar and 'profile_photo' not in student_verification.verification_methods:
                    student_verification.verification_methods.append('profile_photo')
                    student_verification.verification_score = min(100, student_verification.verification_score + 8)
                    score_updated = True
                    changes.append('profile_photo (+8)')
                
                # Check phone
                if profile.phone and 'phone' not in student_verification.verification_methods:
                    student_verification.phone_number = profile.phone
                    student_verification.phone_verified = True
                    student_verification.verification_methods.append('phone')
                    student_verification.verification_score = min(100, student_verification.verification_score + 12)
                    score_updated = True
                    changes.append('phone (+12)')
                
                # Update university info
                if profile.major:
                    student_verification.university = profile.major
                    student_verification.major = profile.major
                
                if profile.graduation_year:
                    student_verification.expected_graduation_year = profile.graduation_year
                
                # Update overall status if score changed
                if score_updated:
                    if student_verification.verification_score >= 70:
                        student_verification.overall_status = 'approved'
                        student_verification.completed_at = timezone.now()
                    elif student_verification.verification_score >= 30:
                        student_verification.overall_status = 'in_progress'
                    
                    student_verification.save()
                    synced_count += 1
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✅ {user.email}: {", ".join(changes)} → Score: {student_verification.verification_score}%'
                        )
                    )
                
            except Profile.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  No profile found for {user.email}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error syncing {user.email}: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✅ Sync complete! Updated {synced_count} student profiles.')
        )
