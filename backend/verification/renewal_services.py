"""Services for verification renewal and expiration management."""

from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta

from .renewal_models import (
    VerificationExpiration,
    VerificationRenewalRequest,
    VerificationExpirationNotification
)
from .access_control import access_control_engine


class VerificationRenewalService:
    """Service for managing verification renewal and expiration."""
    
    def __init__(self):
        self.grace_period_days = 7
        self.warning_days = [30, 7]  # Send warnings at 30 and 7 days
    
    def check_all_expirations(self):
        """Check all verification expirations and update statuses."""
        expirations = VerificationExpiration.objects.all()
        
        results = {
            'checked': 0,
            'expiring_soon': 0,
            'expired': 0,
            'notifications_sent': 0,
        }
        
        for expiration in expirations:
            expiration.check_expiration_status()
            results['checked'] += 1
            
            if expiration.status == 'expiring_soon':
                results['expiring_soon'] += 1
                # Send warning notification
                if self._should_send_warning(expiration):
                    self.send_expiration_warning(expiration.user)
                    results['notifications_sent'] += 1
            
            elif expiration.status == 'expired':
                results['expired'] += 1
                # Start grace period if not already started
                if not expiration.in_grace_period:
                    expiration.start_grace_period(self.grace_period_days)
                    self.send_expiration_notification(expiration.user)
                    results['notifications_sent'] += 1
        
        return results
    
    def _should_send_warning(self, expiration):
        """Determine if warning should be sent."""
        if not expiration.expires_at:
            return False
        
        days_until = (expiration.expires_at - timezone.now()).days
        
        # Send warning at 30 days and 7 days
        if days_until <= 30 and not expiration.expiration_warning_sent:
            return True
        
        return False
    
    def send_expiration_warning(self, user):
        """Send expiration warning notification."""
        try:
            expiration = VerificationExpiration.objects.get(user=user)
            days_until = (expiration.expires_at - timezone.now()).days
            
            # Determine notification type
            if days_until <= 7:
                notification_type = 'warning_7_days'
            else:
                notification_type = 'warning_30_days'
            
            # Create notification record
            VerificationExpirationNotification.objects.create(
                user=user,
                notification_type=notification_type,
                expires_at=expiration.expires_at,
                days_until_expiration=days_until,
                email_sent=True,
            )
            
            # Send email
            subject = f'Your student verification expires in {days_until} days'
            message = f"""
            Hi {user.get_full_name() if hasattr(user, 'get_full_name') else user.email},
            
            Your student verification will expire in {days_until} days on {expiration.expires_at.strftime('%B %d, %Y')}.
            
            To maintain access to:
            - Student discounts (15-20% off)
            - Priority booking
            - Community features
            - Verified student badge
            
            Please renew your verification before it expires.
            
            Renew now: {settings.FRONTEND_URL}/verify-student/renew
            
            Best regards,
            The Homebase Team
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
            
            expiration.expiration_warning_sent = True
            expiration.save()
            
            return True
        except Exception as e:
            print(f"Error sending expiration warning: {e}")
            return False
    
    def send_expiration_notification(self, user):
        """Send notification that verification has expired."""
        try:
            expiration = VerificationExpiration.objects.get(user=user)
            
            # Create notification record
            VerificationExpirationNotification.objects.create(
                user=user,
                notification_type='expired',
                expires_at=expiration.expires_at,
                days_until_expiration=0,
                email_sent=True,
            )
            
            # Send email
            subject = 'Your student verification has expired'
            message = f"""
            Hi {user.get_full_name() if hasattr(user, 'get_full_name') else user.email},
            
            Your student verification has expired.
            
            You now have a {self.grace_period_days}-day grace period to renew your verification.
            During this time, you'll maintain limited access to features.
            
            After the grace period, you'll lose access to:
            - Student discounts
            - Priority booking
            - Community features
            - Verified student badge
            
            Renew now to maintain full access: {settings.FRONTEND_URL}/verify-student/renew
            
            Best regards,
            The Homebase Team
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
            
            expiration.expiration_notification_sent = True
            expiration.save()
            
            return True
        except Exception as e:
            print(f"Error sending expiration notification: {e}")
            return False
    
    def create_renewal_request(self, user, renewal_type='full', documents=None):
        """Create a verification renewal request."""
        renewal = VerificationRenewalRequest.objects.create(
            user=user,
            renewal_type=renewal_type,
            documents_submitted=documents or [],
        )
        
        return renewal
    
    def process_renewal(self, renewal_id, approve=True, reviewer=None, notes=''):
        """Process a renewal request."""
        try:
            renewal = VerificationRenewalRequest.objects.get(id=renewal_id)
            
            if approve:
                renewal.approve(reviewer)
                return {'success': True, 'message': 'Renewal approved'}
            else:
                renewal.reject(reviewer, notes)
                return {'success': True, 'message': 'Renewal rejected'}
        except VerificationRenewalRequest.DoesNotExist:
            return {'success': False, 'message': 'Renewal request not found'}
    
    def get_expiration_status(self, user):
        """Get detailed expiration status for a user."""
        try:
            expiration = VerificationExpiration.objects.get(user=user)
            expiration.check_expiration_status()
            
            if not expiration.expires_at:
                return {
                    'status': 'active',
                    'expires_at': None,
                    'days_until_expiration': None,
                    'in_grace_period': False,
                    'requires_renewal': False,
                }
            
            days_until = (expiration.expires_at - timezone.now()).days
            
            return {
                'status': expiration.status,
                'expires_at': expiration.expires_at.isoformat(),
                'days_until_expiration': days_until,
                'in_grace_period': expiration.in_grace_period,
                'grace_period_ends_at': expiration.grace_period_ends_at.isoformat() if expiration.grace_period_ends_at else None,
                'requires_renewal': expiration.status in ['expiring_soon', 'expired'],
                'renewal_count': expiration.renewal_count,
                'last_renewal_date': expiration.last_renewal_date.isoformat() if expiration.last_renewal_date else None,
            }
        except VerificationExpiration.DoesNotExist:
            # Create expiration record
            expiration = VerificationExpiration.objects.create(user=user)
            expiration.update_expiration_dates()
            
            return self.get_expiration_status(user)
    
    def apply_expiration_penalties(self, user):
        """Apply access penalties for expired verification."""
        try:
            expiration = VerificationExpiration.objects.get(user=user)
            
            if expiration.status == 'expired' and not expiration.in_grace_period:
                # Verification has expired and grace period is over
                # Reduce access level
                return {
                    'access_reduced': True,
                    'message': 'Verification expired. Please renew to restore full access.',
                    'reduced_score': 30,  # Reduce to basic level
                }
            elif expiration.status == 'expired' and expiration.in_grace_period:
                # In grace period - maintain current access but warn
                return {
                    'access_reduced': False,
                    'in_grace_period': True,
                    'grace_period_ends': expiration.grace_period_ends_at.isoformat(),
                    'message': f'Verification expired. Grace period ends {expiration.grace_period_ends_at.strftime("%B %d, %Y")}',
                }
            
            return {'access_reduced': False}
        except VerificationExpiration.DoesNotExist:
            return {'access_reduced': False}


# Global instance
renewal_service = VerificationRenewalService()
