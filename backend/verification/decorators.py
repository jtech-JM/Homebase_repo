"""
Verification Gate Decorators

Provides decorators for protecting views and functions with verification requirements.
"""

from functools import wraps
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required
import logging

from .access_control import access_control_engine

logger = logging.getLogger(__name__)


def verification_required(feature_name, required_score=None, required_methods=None, api_view=False):
    """
    Decorator that requires verification for a view.
    
    Args:
        feature_name: Name of the feature being protected
        required_score: Minimum verification score (optional)
        required_methods: List of required verification methods (optional)
        api_view: Whether this is an API view (returns JSON instead of redirect)
    
    Usage:
        @verification_required('student_housing_booking', required_score=70)
        def create_booking(request):
            # Only accessible to users with 70%+ verification
            pass
        
        @verification_required('community_access', required_score=31, api_view=True)
        def community_api(request):
            # API endpoint with verification requirement
            pass
    """
    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def wrapped_view(request, *args, **kwargs):
            # Skip for non-student users
            if not hasattr(request.user, 'role') or request.user.role != 'student':
                return view_func(request, *args, **kwargs)
            
            # Evaluate access
            decision = access_control_engine.evaluate_access(
                request.user,
                feature_name,
                required_score,
                required_methods
            )
            
            # Log the access attempt
            access_control_engine.log_access_attempt(
                request.user,
                feature_name,
                decision,
                request
            )
            
            # Allow access if granted
            if decision.granted:
                return view_func(request, *args, **kwargs)
            
            # Block access
            if api_view:
                return JsonResponse({
                    'error': 'verification_required',
                    'message': decision.blocking_reason,
                    'verification_score': decision.verification_score,
                    'required_score': decision.required_score,
                    'user_level': decision.user_level,
                    'required_level': decision.required_level,
                    'missing_methods': decision.missing_methods,
                    'verification_url': reverse('verification:student-verification')
                }, status=403)
            else:
                # Store the original URL to redirect back after verification
                request.session['verification_redirect_url'] = request.get_full_path()
                return redirect('verification:verification-required')
        
        return wrapped_view
    return decorator


def student_housing_access(view_func):
    """
    Shortcut decorator for student housing booking access (70%+ verification).
    
    Usage:
        @student_housing_access
        def create_housing_booking(request):
            pass
    """
    return verification_required('student_housing_booking', required_score=70)(view_func)


def community_access(view_func):
    """
    Shortcut decorator for community access (31%+ verification).
    
    Usage:
        @community_access
        def community_view(request):
            pass
    """
    return verification_required('community_access', required_score=31)(view_func)


def peer_verification_access(view_func):
    """
    Shortcut decorator for peer verification access (70%+ verification).
    
    Usage:
        @peer_verification_access
        def verify_peer(request):
            pass
    """
    return verification_required('peer_verification', required_score=70)(view_func)


def student_discount_access(view_func):
    """
    Shortcut decorator for student discount access (70%+ verification).
    
    Usage:
        @student_discount_access
        def apply_student_discount(request):
            pass
    """
    return verification_required('student_discounts', required_score=70)(view_func)


def priority_access(view_func):
    """
    Shortcut decorator for priority features (70%+ verification).
    
    Usage:
        @priority_access
        def priority_booking(request):
            pass
    """
    return verification_required('priority_booking', required_score=70)(view_func)


class VerificationGate:
    """
    Class-based verification gate for more complex scenarios.
    
    Usage:
        gate = VerificationGate('student_housing_booking', required_score=70)
        
        def my_view(request):
            result = gate.check_access(request.user, request)
            if not result.granted:
                return gate.handle_blocked_access(request, result)
            # Continue with view logic
    """
    
    def __init__(self, feature_name, required_score=None, required_methods=None):
        self.feature_name = feature_name
        self.required_score = required_score
        self.required_methods = required_methods
    
    def check_access(self, user, request=None):
        """
        Check if user has access to the feature.
        
        Returns:
            AccessDecision object
        """
        decision = access_control_engine.evaluate_access(
            user,
            self.feature_name,
            self.required_score,
            self.required_methods
        )
        
        # Log if request is provided
        if request:
            access_control_engine.log_access_attempt(
                user,
                self.feature_name,
                decision,
                request
            )
        
        return decision
    
    def handle_blocked_access(self, request, decision, api_view=False):
        """
        Handle blocked access attempt.
        
        Args:
            request: HTTP request
            decision: AccessDecision object
            api_view: Whether to return JSON response
        
        Returns:
            HTTP response (JSON or redirect)
        """
        if api_view or request.path.startswith('/api/'):
            return JsonResponse({
                'error': 'verification_required',
                'message': decision.blocking_reason,
                'verification_score': decision.verification_score,
                'required_score': decision.required_score,
                'user_level': decision.user_level,
                'required_level': decision.required_level,
                'missing_methods': decision.missing_methods,
                'verification_url': reverse('verification:student-verification')
            }, status=403)
        else:
            request.session['verification_redirect_url'] = request.get_full_path()
            return redirect('verification:verification-required')
    
    def get_verification_prompt(self, user):
        """
        Get verification prompt information for the user.
        
        Returns:
            Dictionary with prompt information
        """
        decision = self.check_access(user)
        
        if decision.granted:
            return None
        
        return {
            'feature': self.feature_name,
            'blocking_reason': decision.blocking_reason,
            'current_score': decision.verification_score,
            'required_score': decision.required_score,
            'current_level': decision.user_level,
            'required_level': decision.required_level,
            'missing_methods': decision.missing_methods,
            'verification_url': '/verify-student/'
        }
