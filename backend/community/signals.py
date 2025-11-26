"""Signal handlers for community app integration with verification system."""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import PeerVerificationRequest, PeerVerificationStats
from verification.enhanced_models import StudentVerification, PeerVerification


@receiver(post_save, sender=PeerVerificationRequest)
def sync_peer_verification_to_student_verification(sender, instance, created, **kwargs):
    """
    Sync approved peer verifications from community app to verification app.
    """
    if instance.status == 'approved':
        try:
            # Get or create StudentVerification for the student
            student_verification, created_sv = StudentVerification.objects.get_or_create(
                user=instance.student,
                defaults={
                    'university': 'Unknown',
                    'verification_score': 0,
                }
            )
            
            # Check if this peer verification already exists
            peer_verification_exists = PeerVerification.objects.filter(
                verification=student_verification,
                verifying_student=instance.verifier
            ).exists()
            
            if not peer_verification_exists:
                # Create PeerVerification record in verification app
                PeerVerification.objects.create(
                    verification=student_verification,
                    verifying_student=instance.verifier,
                    knows_personally=True,
                    same_university=True,
                    confidence_level=instance.trust_score or 2,
                    relationship=instance.verification_type,
                    additional_notes=instance.relationship_description,
                    is_approved=True,
                    reviewed_by_agent=instance.reviewed_by_admin
                )
                
                # Update peer verification count
                student_verification.peer_verification_count += 1
                
                # Add to verification methods if not already there
                if 'peer_verification' not in student_verification.verification_methods:
                    student_verification.verification_methods.append('peer_verification')
                
                # Recalculate verification score
                student_verification.calculate_verification_score()
                
                # Update overall status
                if student_verification.verification_score >= 70:
                    student_verification.overall_status = 'approved'
                    student_verification.completed_at = timezone.now()
                elif student_verification.verification_score >= 30:
                    student_verification.overall_status = 'in_progress'
                
                student_verification.save()
                
                print(f"✅ Synced peer verification: {instance.verifier.email} verified {instance.student.email}")
                print(f"   New verification score: {student_verification.verification_score}%")
        
        except Exception as e:
            print(f"❌ Error syncing peer verification: {e}")


@receiver(post_save, sender=PeerVerificationRequest)
def update_peer_verification_stats(sender, instance, created, **kwargs):
    """
    Update PeerVerificationStats when verification request is approved.
    """
    if instance.status == 'approved':
        # Update stats for student (receiver)
        student_stats, _ = PeerVerificationStats.objects.get_or_create(
            user=instance.student
        )
        student_stats.update_stats()
        
        # Update stats for verifier (giver)
        verifier_stats, _ = PeerVerificationStats.objects.get_or_create(
            user=instance.verifier
        )
        verifier_stats.update_stats()
        
        print(f"✅ Updated peer verification stats for {instance.student.email} and {instance.verifier.email}")
