"""
Verification Gate Middleware

Provides automatic verification enforcement for Django views and endpoints.
"""

from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.deprecation import MiddlewareMixin
import logging

from .access_control import access_control_engine

logger = logging.getLogger(__name__)


class VerificationEnforcementMiddleware(MiddlewareMixin):
    """
    Middleware that enforces verification requirements on protected endpoints.
    
    This middleware checks if the current request requires verification
    and blocks access if the user doesn't meet the requirements.
    """
    
    # Endpoints that require verification (can be configured)
    PROTECTED_ENDPOINTS = {
        '/api/bookings/create/': {
            'feature': 'student_housing_booking',
            'required_score': 70,
        },
        '/api/community/': {
            'feature': 'community_access',
            'required_score': 31,
        },
        '/api/peer-verification/': {
            'feature': 'peer_verification',
            'required_score': 70,
        },
    }
    
    def process_request(self, request):
        """
        Process incoming request and check verification requirements.
        """
        # Skip for unauthenticated users
        if not request.user.is_authenticated:
            return None
        
        # Skip for non-student users
        if not hasattr(request.user, 'role') or request.user.role != 'student':
            return None
        
        # Check if this endpoint requires verification
        path = request.path
        endpoint_config = self._get_endpoint_config(path)
        
        if not endpoint_config:
            return None
        
        # Evaluate access
        decision = access_control_engine.evaluate_access(
            request.user,
            endpoint_config['feature'],
            endpoint_config.get('required_score')
        )
        
        # Log the access attempt
        access_control_engine.log_access_attempt(
            request.user,
            endpoint_config['feature'],
            decision,
            request
        )
        
        # Block if access denied
        if not decision.granted:
            return self._handle_blocked_access(request, decision, endpoint_config)
        
        return None
    
    def _get_endpoint_config(self, path):
        """Get configuration for the endpoint if it's protected."""
        for endpoint_pattern, config in self.PROTECTED_ENDPOINTS.items():
            if path.startswith(endpoint_pattern):
                return config
        return None
    
    def _handle_blocked_access(self, request, decision, endpoint_config):
        """Handle blocked access attempt."""
        # For API requests, return JSON response
        if request.path.startswith('/api/'):
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
        
        # For regular requests, redirect to verification page
        return redirect('verification:verification-required')
