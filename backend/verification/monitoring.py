"""Monitoring and reporting for verification system."""

from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict

from .enforcement_models import VerificationGateLog, FeatureAccessConfig
from verification.enhanced_models import StudentVerification
from users.models import User


class VerificationMonitoringService:
    """Service for monitoring verification system metrics."""
    
    def get_system_health(self):
        """Get overall system health metrics."""
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        
        # Access attempts
        total_attempts = VerificationGateLog.objects.filter(timestamp__gte=last_24h).count()
        granted = VerificationGateLog.objects.filter(timestamp__gte=last_24h, access_granted=True).count()
        denied = total_attempts - granted
        
        # Conversion rate (blocked to verified)
        blocked_users = VerificationGateLog.objects.filter(
            timestamp__gte=last_7d,
            access_granted=False
        ).values_list('user_id', flat=True).distinct()
        
        converted = StudentVerification.objects.filter(
            user_id__in=blocked_users,
            university_email_verified=True
        ).count()
        
        conversion_rate = (converted / len(blocked_users) * 100) if blocked_users else 0
        
        return {
            'status': 'healthy' if granted / total_attempts > 0.7 else 'warning',
            'access_attempts_24h': total_attempts,
            'access_granted_24h': granted,
            'access_denied_24h': denied,
            'grant_rate': round(granted / total_attempts * 100, 2) if total_attempts > 0 else 0,
            'conversion_rate_7d': round(conversion_rate, 2),
            'timestamp': now.isoformat(),
        }
    
    def get_verification_metrics(self):
        """Get verification distribution metrics."""
        total_users = User.objects.filter(role='student').count()
        
        # Verification levels
        unverified = User.objects.filter(role='student').exclude(
            id__in=StudentVerification.objects.filter(university_email_verified=True).values_list('user_id', flat=True)
        ).count()
        
        basic = StudentVerification.objects.filter(
            verification_score__gte=31,
            verification_score__lt=70
        ).count()
        
        verified = StudentVerification.objects.filter(
            verification_score__gte=70
        ).count()
        
        return {
            'total_students': total_users,
            'unverified': unverified,
            'basic_verified': basic,
            'fully_verified': verified,
            'verification_rate': round((basic + verified) / total_users * 100, 2) if total_users > 0 else 0,
        }
    
    def get_feature_usage(self):
        """Get feature usage statistics."""
        last_7d = timezone.now() - timedelta(days=7)
        
        # Group by feature
        feature_stats = VerificationGateLog.objects.filter(
            timestamp__gte=last_7d
        ).values('feature_name').annotate(
            total=Count('id'),
            granted=Count('id', filter=Q(access_granted=True)),
            denied=Count('id', filter=Q(access_granted=False))
        ).order_by('-total')
        
        return list(feature_stats)
    
    def get_blocking_reasons(self):
        """Get most common blocking reasons."""
        last_7d = timezone.now() - timedelta(days=7)
        
        reasons = VerificationGateLog.objects.filter(
            timestamp__gte=last_7d,
            access_granted=False
        ).values('blocking_reason').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return list(reasons)
    
    def get_performance_metrics(self):
        """Get system performance metrics."""
        last_24h = timezone.now() - timedelta(hours=24)
        
        # Average response time (if tracked)
        logs = VerificationGateLog.objects.filter(timestamp__gte=last_24h)
        
        return {
            'total_checks': logs.count(),
            'avg_checks_per_hour': logs.count() / 24,
            'peak_hour': self._get_peak_hour(logs),
        }
    
    def _get_peak_hour(self, logs):
        """Get peak usage hour."""
        hour_counts = defaultdict(int)
        for log in logs:
            hour_counts[log.timestamp.hour] += 1
        
        if hour_counts:
            peak = max(hour_counts.items(), key=lambda x: x[1])
            return {'hour': peak[0], 'count': peak[1]}
        return None
    
    def generate_report(self, period='daily'):
        """Generate comprehensive report."""
        return {
            'period': period,
            'generated_at': timezone.now().isoformat(),
            'system_health': self.get_system_health(),
            'verification_metrics': self.get_verification_metrics(),
            'feature_usage': self.get_feature_usage(),
            'blocking_reasons': self.get_blocking_reasons(),
            'performance': self.get_performance_metrics(),
        }


monitoring_service = VerificationMonitoringService()
