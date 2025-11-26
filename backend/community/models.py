from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class Post(models.Model):
    CATEGORY_CHOICES = [
        ('roommates', 'Roommate Search'),
        ('advice', 'Student Advice'),
        ('events', 'Events & Meetups'),
        ('general', 'General Discussion'),
    ]
    
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.author.email} - {self.category} - {self.created_at.strftime('%Y-%m-%d')}"
    
    @property
    def likes_count(self):
        return self.likes.count()
    
    @property
    def comments_count(self):
        return self.comments.count()


class Like(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'post')
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.email} likes {self.post.id}"


class Comment(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        
    def __str__(self):
        return f"{self.author.email} on {self.post.id}"


# Peer Verification Models

class PeerVerificationRequest(models.Model):
    """Request for peer verification from another student."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='peer_verification_requests_received'
    )
    verifier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='community_peer_verifications_given'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    verification_type = models.CharField(
        max_length=50,
        choices=[
            ('roommate', 'Roommate Verification'),
            ('classmate', 'Classmate Verification'),
            ('club_member', 'Club/Organization Member'),
            ('general', 'General Student Verification'),
        ],
        default='general'
    )
    trust_score = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    relationship_description = models.TextField()
    verification_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    reviewed_by_admin = models.BooleanField(default=False)
    admin_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('student', 'verifier', 'verification_type')
    
    def __str__(self):
        return f"{self.verifier.email} verifying {self.student.email}"


class PeerVerificationStats(models.Model):
    """Statistics for peer verification system."""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='peer_verification_stats'
    )
    verifications_received = models.IntegerField(default=0)
    verifications_given = models.IntegerField(default=0)
    average_trust_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    reputation_score = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Peer verification stats'
    
    def __str__(self):
        return f"Peer stats for {self.user.email}"
    
    def update_stats(self):
        """Recalculate statistics."""
        approved_received = PeerVerificationRequest.objects.filter(
            student=self.user,
            status='approved'
        )
        self.verifications_received = approved_received.count()
        self.verifications_given = PeerVerificationRequest.objects.filter(
            verifier=self.user,
            status='approved'
        ).count()
        
        trust_scores = approved_received.filter(
            trust_score__isnull=False
        ).values_list('trust_score', flat=True)
        
        if trust_scores:
            self.average_trust_score = sum(trust_scores) / len(trust_scores)
        else:
            self.average_trust_score = 0.00
        
        self.reputation_score = (
            self.verifications_received * 10 +
            int(self.average_trust_score * 20)
        )
        self.save()


class PeerVerificationLog(models.Model):
    """Audit log for peer verification actions."""
    
    ACTION_CHOICES = [
        ('request_created', 'Request Created'),
        ('request_approved', 'Request Approved'),
        ('request_rejected', 'Request Rejected'),
        ('request_expired', 'Request Expired'),
        ('admin_review', 'Admin Review'),
    ]
    
    verification_request = models.ForeignKey(
        PeerVerificationRequest,
        on_delete=models.CASCADE,
        related_name='logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action} - {self.verification_request.id}"
