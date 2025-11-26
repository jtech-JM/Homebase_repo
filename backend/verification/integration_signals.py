"""Signal handlers for integrating with existing verification system."""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from verification.enhanced_models import StudentVerification
from verification.renewal_models import VerificationExpiration
from verification.access_control import access_control_engine
from verification.models import Verification
from profiles.models import Profile


@receiver(post_save, sender=StudentVerification)
def handle_verification_update(sender, instance, created, **kwargs):
    """Handle verification completion and updates."""
    # Update expiration tracking
    expiration, _ = VerificationExpiration.objects.get_or_create(user=instance.user)
    expiration.update_expiration_dates()
    
    # Clear any cached permissions
    # This ensures real-time updates
    cache_key = f'verification_score_{instance.user.id}'
    from django.core.cache import cache
    cache.delete(cache_key)
    
    # Log verification milestone
    score = access_control_engine.get_user_verification_score(instance.user)
    if score >= 70 and not created:
        # User reached verified status
        pass  # Could trigger celebration notification


@receiver(post_save, sender=Verification)
def update_verification_score_on_upload(sender, instance, created, **kwargs):
    """
    Update StudentVerification score when a document is uploaded.
    """
    if created:  # Only on new uploads
        user = instance.user
        
        # Get or create StudentVerification for this user
        student_verification, created_sv = StudentVerification.objects.get_or_create(
            user=user,
            defaults={
                'university': 'Unknown',  # Will be updated later
                'verification_score': 0,
            }
        )
        
        # Update verification fields based on document type
        verification_type = instance.verification_type
        
        if verification_type == 'student_id':
            student_verification.student_id_document = instance.document
            student_verification.document_is_valid = True
            # Add to verification methods if not already there
            if 'student_id_upload' not in student_verification.verification_methods:
                student_verification.verification_methods.append('student_id_upload')
                # Recalculate score using the model's method
                student_verification.calculate_verification_score()
        
        elif verification_type == 'property_proof':
            # Add to additional documents
            if not student_verification.additional_documents:
                student_verification.additional_documents = []
            student_verification.additional_documents.append({
                'type': 'property_proof',
                'document': str(instance.document),
                'uploaded_at': timezone.now().isoformat()
            })
            # Add 20-30 points for property proof
            student_verification.verification_score = min(100, student_verification.verification_score + 25)
        
        elif verification_type == 'enrollment':
            # Add to additional documents
            if not student_verification.additional_documents:
                student_verification.additional_documents = []
            student_verification.additional_documents.append({
                'type': 'enrollment',
                'document': str(instance.document),
                'uploaded_at': timezone.now().isoformat()
            })
            # Add to verification methods
            if 'enrollment' not in student_verification.verification_methods:
                student_verification.verification_methods.append('enrollment')
            # Recalculate score using the model's method
            student_verification.calculate_verification_score()
        
        elif verification_type == 'profile_photo':
            # Add to additional documents
            if not student_verification.additional_documents:
                student_verification.additional_documents = []
            student_verification.additional_documents.append({
                'type': 'profile_photo',
                'document': str(instance.document),
                'uploaded_at': timezone.now().isoformat()
            })
            # Add to verification methods
            if 'profile_photo' not in student_verification.verification_methods:
                student_verification.verification_methods.append('profile_photo')
            # Recalculate score using the model's method
            student_verification.calculate_verification_score()
        
        elif verification_type == 'national_id':
            # Add to additional documents
            if not student_verification.additional_documents:
                student_verification.additional_documents = []
            student_verification.additional_documents.append({
                'type': 'national_id',
                'document': str(instance.document),
                'uploaded_at': timezone.now().isoformat()
            })
            # Add 15-20 points for national ID
            student_verification.verification_score = min(100, student_verification.verification_score + 18)
        
        # Update overall status
        if student_verification.verification_score >= 70:
            student_verification.overall_status = 'approved'
            student_verification.completed_at = timezone.now()
        elif student_verification.verification_score >= 30:
            student_verification.overall_status = 'in_progress'
        else:
            student_verification.overall_status = 'pending'
        
        student_verification.save()
        
        print(f"✅ Updated verification score for {user.email}: {student_verification.verification_score}%")


@receiver(post_save, sender=Verification)
def update_score_on_approval(sender, instance, created, **kwargs):
    """
    Update verification score when admin approves a document.
    """
    if not created and instance.status == 'approved':
        user = instance.user
        
        try:
            student_verification = StudentVerification.objects.get(user=user)
            
            # If document was just approved, add bonus points
            if instance.verification_type == 'student_id':
                # Add 10 bonus points for admin approval
                student_verification.verification_score = min(100, student_verification.verification_score + 10)
                student_verification.overall_status = 'approved'
                student_verification.completed_at = timezone.now()
            
            student_verification.save()
            
            print(f"✅ Approved verification for {user.email}: {student_verification.verification_score}%")
        
        except StudentVerification.DoesNotExist:
            pass



@receiver(post_save, sender=Profile)
def update_verification_on_profile_update(sender, instance, created, **kwargs):
    """
    Update verification score when profile is updated with avatar or other info.
    """
    user = instance.user
    
    # Only process for students
    if user.role != 'student':
        return
    
    # Get or create StudentVerification
    student_verification, created_sv = StudentVerification.objects.get_or_create(
        user=user,
        defaults={
            'university': instance.major or 'Unknown',
            'verification_score': 0,
        }
    )
    
    score_updated = False
    
    # Check if avatar was just added
    if instance.avatar and 'profile_photo' not in student_verification.verification_methods:
        student_verification.verification_methods.append('profile_photo')
        student_verification.calculate_verification_score()
        score_updated = True
        print(f"✅ Profile photo added for {user.email}")
    
    # Check if phone was added
    if hasattr(instance, 'phone') and instance.phone and 'phone' not in student_verification.verification_methods:
        student_verification.phone_number = instance.phone
        student_verification.phone_verified = True
        student_verification.verification_methods.append('phone')
        student_verification.verification_score = min(100, student_verification.verification_score + 12)
        score_updated = True
        print(f"✅ Phone added for {user.email}: +12 points")
    
    # Update university info if available
    if instance.major:
        student_verification.university = instance.major
        student_verification.major = instance.major
    
    if instance.graduation_year:
        student_verification.expected_graduation_year = instance.graduation_year
    
    # Update overall status if score changed
    if score_updated:
        if student_verification.verification_score >= 70:
            student_verification.overall_status = 'approved'
            student_verification.completed_at = timezone.now()
        elif student_verification.verification_score >= 30:
            student_verification.overall_status = 'in_progress'
        
        student_verification.save()
        
        print(f"✅ Updated verification score for {user.email}: {student_verification.verification_score}%")
