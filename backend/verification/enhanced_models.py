from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator
import uuid
import os

class StudentVerification(models.Model):
    """Enhanced student verification model with multiple verification methods"""
    
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('requires_additional_info', 'Requires Additional Information'),
    ]
    
    VERIFICATION_METHOD_CHOICES = [
        ('student_id_upload', 'Student ID Document Upload'),
        ('university_email', 'University Email Verification'),
        ('phone_verification', 'Phone Number Verification'),
        ('social_media', 'Social Media Verification'),
        ('peer_verification', 'Peer Verification'),
        ('geolocation', 'Geolocation Verification'),
        ('agent_manual_review', 'Agent Manual Review'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_verifications')
    verification_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Basic Information
    university = models.CharField(max_length=200)
    student_id_number = models.CharField(max_length=50, blank=True)
    expected_graduation_year = models.IntegerField(null=True, blank=True)
    major = models.CharField(max_length=100, blank=True)
    
    # Verification Methods
    verification_methods = models.JSONField(default=list)  # List of completed verification methods
    overall_status = models.CharField(max_length=30, choices=VERIFICATION_STATUS_CHOICES, default='pending')
    
    # Document Upload
    student_id_document = models.FileField(upload_to='student_verifications/documents/', null=True, blank=True)
    additional_documents = models.JSONField(default=list)  # List of additional document URLs
    
    # OCR and Document Analysis Results
    ocr_extracted_text = models.TextField(blank=True)
    document_analysis_results = models.JSONField(default=dict)
    university_logo_detected = models.BooleanField(default=False)
    document_expiry_date = models.DateField(null=True, blank=True)
    document_is_valid = models.BooleanField(default=False)
    
    # Contact Verification
    phone_number = models.CharField(max_length=20, blank=True)
    phone_verified = models.BooleanField(default=False)
    phone_verification_code = models.CharField(max_length=6, blank=True)
    phone_verification_expires = models.DateTimeField(null=True, blank=True)
    
    # University Email Verification
    university_email = models.EmailField(blank=True)
    university_email_verified = models.BooleanField(default=False)
    university_domain_valid = models.BooleanField(default=False)
    
    # Social Media Verification
    linkedin_profile = models.URLField(blank=True)
    facebook_profile = models.URLField(blank=True)
    social_media_verified = models.BooleanField(default=False)
    
    # Peer Verification
    peer_verifications = models.JSONField(default=list)  # List of peer verification records
    peer_verification_count = models.IntegerField(default=0)
    peer_verification_required = models.IntegerField(default=2)  # Number of peer verifications needed
    
    # Geolocation Verification
    registration_location = models.JSONField(default=dict)  # {lat, lng, address}
    campus_proximity_verified = models.BooleanField(default=False)
    location_verification_optional = models.BooleanField(default=True)
    
    # Agent Review
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_verifications'
    )
    agent_review_status = models.CharField(max_length=30, choices=VERIFICATION_STATUS_CHOICES, default='pending')
    agent_notes = models.TextField(blank=True)
    agent_reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Verification Score (0-100)
    verification_score = models.IntegerField(default=0)
    minimum_score_required = models.IntegerField(default=70)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'overall_status']),
            models.Index(fields=['assigned_agent', 'agent_review_status']),
            models.Index(fields=['verification_score']),
        ]
    
    def __str__(self):
        return f"Verification for {self.user.email} - {self.overall_status}"
    
    def calculate_verification_score(self):
        """Calculate verification score based on completed methods (simplified system)"""
        score = 0
        
        # Student ID Document (50 points - most important)
        if self.student_id_document and self.document_is_valid:
            score += 50
        elif 'student_id_upload' in self.verification_methods:
            score += 50
        
        # Enrollment Letter (40 points - second most important)
        if 'enrollment' in self.verification_methods:
            score += 40
        
        # Profile Photo (10 points - basic requirement)
        if 'profile_photo' in self.verification_methods:
            score += 10
        
        # Bonus: Agent manual review (optional boost)
        if self.agent_review_status == 'approved':
            score = min(score + 5, 100)
        
        self.verification_score = min(score, 100)
        return self.verification_score
    
    def is_verification_complete(self):
        """Check if verification meets minimum requirements"""
        self.calculate_verification_score()
        return self.verification_score >= self.minimum_score_required
    
    def get_required_steps(self):
        """Get list of required verification steps"""
        required_steps = []
        
        if not self.student_id_document:
            required_steps.append('student_id_upload')
        
        if not self.university_email_verified:
            required_steps.append('university_email')
        
        if not self.phone_verified:
            required_steps.append('phone_verification')
        
        if self.peer_verification_count < self.peer_verification_required:
            required_steps.append('peer_verification')
        
        return required_steps
    
    def get_optional_steps(self):
        """Get list of optional verification steps"""
        optional_steps = []
        
        if not self.social_media_verified:
            optional_steps.append('social_media')
        
        if not self.campus_proximity_verified and self.location_verification_optional:
            optional_steps.append('geolocation')
        
        return optional_steps


class VerificationStep(models.Model):
    """Track individual verification steps"""
    
    STEP_STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('skipped', 'Skipped'),
    ]
    
    verification = models.ForeignKey(StudentVerification, on_delete=models.CASCADE, related_name='steps')
    step_type = models.CharField(max_length=30, choices=StudentVerification.VERIFICATION_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STEP_STATUS_CHOICES, default='not_started')
    is_required = models.BooleanField(default=True)
    is_optional = models.BooleanField(default=False)
    
    # Step-specific data
    step_data = models.JSONField(default=dict)
    error_message = models.TextField(blank=True)
    
    # Timestamps
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['verification', 'step_type']
        ordering = ['verification', 'step_type']
    
    def __str__(self):
        return f"{self.verification.user.email} - {self.get_step_type_display()}: {self.status}"


class PeerVerification(models.Model):
    """Peer verification records"""
    
    verification = models.ForeignKey(StudentVerification, on_delete=models.CASCADE, related_name='peer_verifications_records')
    verifying_student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='peer_verifications_given')
    
    # Verification details
    knows_personally = models.BooleanField(default=False)
    same_university = models.BooleanField(default=False)
    confidence_level = models.IntegerField(choices=[(1, 'Low'), (2, 'Medium'), (3, 'High')], default=2)
    relationship = models.CharField(max_length=100, blank=True)  # classmate, friend, etc.
    additional_notes = models.TextField(blank=True)
    
    # Status
    is_approved = models.BooleanField(default=False)
    reviewed_by_agent = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['verification', 'verifying_student']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Peer verification by {self.verifying_student.email} for {self.verification.user.email}"


class VerificationDocument(models.Model):
    """Store additional verification documents"""
    
    DOCUMENT_TYPE_CHOICES = [
        ('student_id', 'Student ID Card'),
        ('enrollment_letter', 'Enrollment Letter'),
        ('transcript', 'Academic Transcript'),
        ('tuition_receipt', 'Tuition Receipt'),
        ('class_schedule', 'Class Schedule'),
        ('library_card', 'Library Card'),
        ('other', 'Other'),
    ]
    
    verification = models.ForeignKey(StudentVerification, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPE_CHOICES)
    document_file = models.FileField(upload_to='student_verifications/additional_docs/')
    
    # OCR and analysis results
    ocr_text = models.TextField(blank=True)
    analysis_results = models.JSONField(default=dict)
    is_valid = models.BooleanField(default=False)
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_document_type_display()} for {self.verification.user.email}"