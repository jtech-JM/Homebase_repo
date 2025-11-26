"""
Views for handling verification gate interactions.
"""

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from .access_control import access_control_engine
from .enforcement_models import VerificationBenefit


@login_required
def verification_required_view(request):
    """
    View shown when user is blocked by verification gate.
    
    Displays verification requirements and benefits.
    """
    user = request.user
    
    # Get user's current verification status
    score = access_control_engine.get_user_verification_score(user)
    level = access_control_engine.get_verification_level(score)
    permissions = access_control_engine.calculate_feature_permissions(user)
    
    # Get verification benefits
    benefits = VerificationBenefit.objects.filter(is_active=True).order_by('display_order')
    
    # Get the URL to redirect to after verification
    redirect_url = request.session.get('verification_redirect_url', '/')
    
    context = {
        'verification_score': score,
        'verification_level': level,
        'permissions': permissions,
        'benefits': benefits,
        'redirect_url': redirect_url,
    }
    
    return render(request, 'verification/verification_required.html', context)


@login_required
@require_http_methods(["GET"])
def verification_status_api(request):
    """
    API endpoint to get user's verification status and permissions.
    
    Returns JSON with verification score, level, and feature permissions.
    """
    user = request.user
    
    # Get verification status
    score = access_control_engine.get_user_verification_score(user)
    level = access_control_engine.get_verification_level(score)
    permissions = access_control_engine.calculate_feature_permissions(user)
    
    return JsonResponse({
        'verification_score': score,
        'verification_level': level,
        'permissions': {
            'can_book_student_housing': permissions.can_book_student_housing,
            'can_book_premium_housing': permissions.can_book_premium_housing,
            'can_access_student_discounts': permissions.can_access_student_discounts,
            'can_access_community': permissions.can_access_community,
            'can_peer_verify': permissions.can_peer_verify,
            'can_access_priority_features': permissions.can_access_priority_features,
        }
    })


@login_required
@require_http_methods(["POST"])
def refresh_permissions_api(request):
    """
    API endpoint to manually refresh user's permissions cache.
    
    Useful after verification status changes.
    """
    user = request.user
    
    # Update access level and permissions
    new_level = access_control_engine.update_user_access_level(user)
    permissions_dict = access_control_engine.update_permissions_cache(user)
    
    return JsonResponse({
        'success': True,
        'message': 'Permissions refreshed successfully',
        'verification_level': new_level,
        'permissions': permissions_dict
    })


@login_required
@require_http_methods(["GET"])
def check_feature_access_api(request, feature_name):
    """
    API endpoint to check if user has access to a specific feature.
    
    Args:
        feature_name: Name of the feature to check
    
    Returns:
        JSON with access decision
    """
    user = request.user
    
    # Evaluate access
    decision = access_control_engine.evaluate_access(user, feature_name)
    
    return JsonResponse({
        'granted': decision.granted,
        'verification_score': decision.verification_score,
        'required_score': decision.required_score,
        'user_level': decision.user_level,
        'required_level': decision.required_level,
        'blocking_reason': decision.blocking_reason if not decision.granted else None,
        'missing_methods': decision.missing_methods if not decision.granted else []
    })
