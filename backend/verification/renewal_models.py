"""Models for verification renewal and expiration management."""

from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class VerificationExpiration(models.Model):
    """Track verification expiration dates and renewal status."""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expiring_soon', 'Expiring Soon'),
        ('expired', 'Expired'),
        ('renewed', 'Renewed'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='verification_expiration'
    )
    
    # Expiration dates for different verification methods
    university_email_expires_at = models.DateTimeField(null=True, blank=True)
    student_id_expires_at = models.DateTimeField(null=True, blank=True)
    enrollment_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Overall verification expiration (earliest of all methods)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    last_renewal_date = models.DateTimeField(null=True, blank=True)
    renewal_count = models.IntegerField(default=0)
    
    # Notifications
    expiration_warning_sent = models.BooleanField(default=False)
    expiration_notification_sent = models.BooleanField(default=False)
    
    # Grace period
    grace_period_ends_at = models.DateTimeField(null=True, blank=True)
    in_grace_period = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['expires_at', 'status']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Verification expiration for {self.user.email}"
    
    def update_expiration_dates(self):
        """Update expiration dates based on verification methods."""
        from verification.enhanced_models import StudentVerification
        
        try:
            verification = StudentVerification.objects.get(user=self.user)
            
            # Set expiration dates (1 year from verification date)
            if verification.university_email_verified:
                # Use completed_at or created_at as base date
                base_date = verification.completed_at or verification.created_at
                self.university_email_expires_at = base_date + timedelta(days=365)
            
            if verification.student_id_document and verification.document_is_valid:
                # Use completed_at or created_at as base date
                base_date = verification.completed_at or verification.created_at
                self.student_id_expires_at = base_date + timedelta(days=365)
            
            if 'enrollment' in verification.verification_methods:
                # Use completed_at or created_at as base date
                base_date = verification.completed_at or verification.created_at
                self.enrollment_expires_at = base_date + timedelta(days=365)
            
            # Set overall expiration to earliest date
            expiration_dates = [
                d for d in [
                    self.university_email_expires_at,
                    self.student_id_expires_at,
                    self.enrollment_expires_at
                ] if d is not None
            ]
            
            if expiration_dates:
                self.expires_at = min(expiration_dates)
            
            self.save()
        except StudentVerification.DoesNotExist:
            pass
    
    def check_expiration_status(self):
        """Check and update expiration status."""
        if not self.expires_at:
            self.status = 'active'
            self.save()
            return
        
        now = timezone.now()
        days_until_expiration = (self.expires_at - now).days
        
        if days_until_expiration < 0:
            # Expired
            if self.grace_period_ends_at and now < self.grace_period_ends_at:
                self.status = 'expired'
                self.in_grace_period = True
            else:
                self.status = 'expired'
                self.in_grace_period = False
        elif days_until_expiration <= 30:
            # Expiring soon (within 30 days)
            self.status = 'expiring_soon'
        else:
            self.status = 'active'
        
        self.save()
    
    def start_grace_period(self, days=7):
        """Start grace period after expiration."""
        self.grace_period_ends_at = timezone.now() + timedelta(days=days)
        self.in_grace_period = True
        self.save()
    
    def renew(self):
        """Renew verification."""
        self.last_renewal_date = timezone.now()
        self.renewal_count += 1
        self.status = 'renewed'
        self.in_grace_period = False
        self.grace_period_ends_at = None
        self.expiration_warning_sent = False
        self.expiration_notification_sent = False
        
        # Update expiration dates
        self.update_expiration_dates()
        self.save()


class VerificationRenewalRequest(models.Model):
    """Track verification renewal requests."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='renewal_requests'
    )
    
    # Renewal details
    renewal_type = models.CharField(
        max_length=50,
        choices=[
            ('university_email', 'University Email'),
            ('student_id', 'Student ID'),
            ('enrollment', 'Enrollment Verification'),
            ('full', 'Full Verification Renewal'),
        ]
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Documents
    documents_submitted = models.JSONField(default=list, blank=True)
    
    # Review
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_renewals'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Renewal request for {self.user.email} - {self.renewal_type}"
    
    def approve(self, reviewer):
        """Approve renewal request."""
        self.status = 'approved'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.save()
        
        # Update verification expiration
        try:
            expiration = VerificationExpiration.objects.get(user=self.user)
            expiration.renew()
        except VerificationExpiration.DoesNotExist:
            pass
    
    def reject(self, reviewer, reason=''):
        """Reject renewal request."""
        self.status = 'rejected'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_notes = reason
        self.save()


class VerificationExpirationNotification(models.Model):
    """Track expiration notifications sent to users."""
    
    NOTIFICATION_TYPE_CHOICES = [
        ('warning_30_days', '30 Days Warning'),
        ('warning_7_days', '7 Days Warning'),
        ('expired', 'Expired Notification'),
        ('grace_period', 'Grace Period Notification'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='expiration_notifications'
    )
    
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES)
    sent_at = models.DateTimeField(auto_now_add=True)
    
    # Notification details
    expires_at = models.DateTimeField()
    days_until_expiration = models.IntegerField()
    
    # Delivery
    email_sent = models.BooleanField(default=False)
    in_app_notification_sent = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"{self.notification_type} for {self.user.email}"
