from django.db import models
from django.conf import settings


class PlatformSettings(models.Model):
    """
    Singleton model for platform-wide settings
    """
    platform_fee = models.DecimalField(max_digits=5, decimal_places=2, default=5.0, help_text="Platform fee percentage")
    max_applications_per_student = models.IntegerField(default=5, help_text="Maximum applications a student can submit")
    maintenance_response_time = models.IntegerField(default=24, help_text="Expected maintenance response time in hours")
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    auto_approval = models.BooleanField(default=False, help_text="Auto-approve applications for verified users")
    verification_required = models.BooleanField(default=True, help_text="Require verification for property listings")
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='settings_updates')

    class Meta:
        verbose_name = "Platform Settings"
        verbose_name_plural = "Platform Settings"

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass  # Prevent deletion

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj


class AdminActivityLog(models.Model):
    """
    Log all admin actions for audit purposes
    """
    ACTION_CHOICES = [
        ('user_update', 'User Update'),
        ('user_role_change', 'User Role Change'),
        ('user_status_change', 'User Status Change'),
        ('property_update', 'Property Update'),
        ('property_verification', 'Property Verification'),
        ('application_action', 'Application Action'),
        ('payment_action', 'Payment Action'),
        ('settings_update', 'Settings Update'),
        ('ticket_action', 'Ticket Action'),
    ]

    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='admin_actions')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    target_model = models.CharField(max_length=50)  # e.g., 'User', 'Property'
    target_id = models.IntegerField()
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)  # Store additional context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin', 'created_at']),
            models.Index(fields=['action', 'created_at']),
        ]

    def __str__(self):
        return f"{self.admin.email} - {self.action} - {self.created_at}"
