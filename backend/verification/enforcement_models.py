from django.db import models
from django.conf import settings
from django.utils import timezone


class VerificationGateLog(models.Model):
    """Track access attempts and decisions for verification gates"""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='verification_gate_logs'
    )
    feature = models.CharField(max_length=100, db_index=True)
    access_granted = models.BooleanField(default=False)
    verification_score_at_time = models.IntegerField(default=0)
    required_score = models.IntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    user_agent = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # Additional context
    blocking_reason = models.TextField(blank=True)
    verification_methods_completed = models.JSONField(default=list)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'feature', '-timestamp']),
            models.Index(fields=['access_granted', '-timestamp']),
        ]
    
    def __str__(self):
        status = "Granted" if self.access_granted else "Denied"
        return f"{self.user.email} - {self.feature} - {status} at {self.timestamp}"


class FeatureAccessConfig(models.Model):
    """Configurable verification requirements for platform features"""
    
    ACCESS_LEVEL_CHOICES = [
        ('basic', 'Basic'),
        ('verified', 'Verified'),
        ('premium', 'Premium'),
    ]
    
    feature_name = models.CharField(max_length=100, unique=True, db_index=True)
    minimum_verification_score = models.IntegerField(default=0)
    required_verification_methods = models.JSONField(
        default=list,
        help_text="List of verification methods that must be completed"
    )
    access_level = models.CharField(
        max_length=20, 
        choices=ACCESS_LEVEL_CHOICES, 
        default='basic'
    )
    is_active = models.BooleanField(default=True)
    
    # Feature description and messaging
    feature_description = models.TextField(blank=True)
    blocked_message = models.TextField(
        blank=True,
        help_text="Message shown to users when access is denied"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['feature_name']
        verbose_name = "Feature Access Configuration"
        verbose_name_plural = "Feature Access Configurations"
    
    def __str__(self):
        return f"{self.feature_name} - Min Score: {self.minimum_verification_score}"


class VerificationBenefit(models.Model):
    """Manage verification incentives and benefits"""
    
    VERIFICATION_LEVEL_CHOICES = [
        ('unverified', 'Unverified (0-30%)'),
        ('basic', 'Basic (31-69%)'),
        ('verified', 'Verified (70%+)'),
    ]
    
    FEATURE_CATEGORY_CHOICES = [
        ('booking', 'Booking & Housing'),
        ('listing', 'Listing Access'),
        ('community', 'Community Features'),
        ('payment', 'Payment & Discounts'),
        ('priority', 'Priority Access'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    verification_level_required = models.CharField(
        max_length=20, 
        choices=VERIFICATION_LEVEL_CHOICES
    )
    feature_category = models.CharField(
        max_length=50, 
        choices=FEATURE_CATEGORY_CHOICES
    )
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    
    # Visual elements
    icon_name = models.CharField(max_length=50, blank=True)
    badge_color = models.CharField(max_length=20, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_order', 'name']
        verbose_name = "Verification Benefit"
        verbose_name_plural = "Verification Benefits"
    
    def __str__(self):
        return f"{self.name} - {self.get_verification_level_required_display()}"
