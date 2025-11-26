"""Views for verification status display across platform."""

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from .models import User
from .verification_serializers import (
    UserProfileWithVerificationSerializer,
    StudentApplicationWithVerificationSerializer
)
from verification.access_control import access_control_engine
from listings.models import Booking


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_verification_status(request):
    """Get current user's verification status."""
    score = access_control_engine.get_user_verification_score(request.user)
    level = access_control_engine.get_verification_level(score)
    permissions = access_control_engine.calculate_feature_permissions(request.user)
    
    # Get verification methods completed
    methods_completed = []
    try:
        from verification.enhanced_models import StudentVerification
        verification = StudentVerification.objects.filter(user=request.user).first()
        if verification:
            # Use the verification_methods array
            methods_completed = verification.verification_methods or []
    except Exception:
        pass
    
    # Calculate next milestone
    next_milestone = None
    if score < 31:
        next_milestone = {
            'score': 31,
            'level': 'basic',
            'points_needed': 31 - score,
            'benefits': ['Community access', 'Make bookings', 'Contact landlords']
        }
    elif score < 70:
        next_milestone = {
            'score': 70,
            'level': 'verified',
            'points_needed': 70 - score,
            'benefits': ['Student discounts', 'Priority booking', 'Peer verification']
        }
    elif score < 100:
        next_milestone = {
            'score': 100,
            'level': 'premium',
            'points_needed': 100 - score,
            'benefits': ['Maximum discounts', 'Premium features', 'Exclusive listings']
        }
    
    return Response({
        'score': score,
        'level': level,
        'methods_completed': methods_completed,
        'permissions': {
            'can_book_student_housing': permissions.can_book_student_housing,
            'can_book_premium_housing': permissions.can_book_premium_housing,
            'can_access_student_discounts': permissions.can_access_student_discounts,
            'can_access_priority_features': permissions.can_access_priority_features,
            'can_access_community': permissions.can_access_community,
        },
        'next_milestone': next_milestone,
        'badge': {
            'icon': '✓' if score >= 70 else '📧' if score >= 31 else '○',
            'label': 'Verified Student' if score >= 70 else 'Basic Verified' if score >= 31 else 'Unverified',
            'color': 'green' if score >= 70 else 'blue' if score >= 31 else 'gray',
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_verification_badge(request, user_id):
    """Get verification badge for a specific user (for display in listings, etc)."""
    user = get_object_or_404(User, id=user_id)
    
    score = access_control_engine.get_user_verification_score(user)
    level = access_control_engine.get_verification_level(score)
    
    return Response({
        'user_id': user.id,
        'score': score,
        'level': level,
        'badge': {
            'icon': '✓' if score >= 70 else '📧' if score >= 31 else '○',
            'label': 'Verified Student' if score >= 70 else 'Basic Verified' if score >= 31 else 'Unverified',
            'color': 'green' if score >= 70 else 'blue' if score >= 31 else 'gray',
            'show_in_profile': True,
            'show_in_listings': score >= 31,  # Only show if at least basic verified
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def landlord_applications_with_verification(request):
    """Get applications with verification status for landlord view."""
    if request.user.role != 'landlord':
        return Response({
            'error': 'Only landlords can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get bookings for landlord's listings
    bookings = Booking.objects.filter(
        listing__landlord=request.user
    ).select_related('student', 'listing').order_by('-created_at')
    
    applications = []
    for booking in bookings:
        score = access_control_engine.get_user_verification_score(booking.student)
        level = access_control_engine.get_verification_level(score)
        
        # Verification highlights
        highlights = []
        if score >= 70:
            highlights.append({
                'type': 'success',
                'icon': '✓',
                'text': 'Fully Verified Student',
                'priority': 1
            })
        elif score >= 31:
            highlights.append({
                'type': 'info',
                'icon': '📧',
                'text': 'University Email Verified',
                'priority': 2
            })
        else:
            highlights.append({
                'type': 'warning',
                'icon': '⚠️',
                'text': 'Unverified',
                'priority': 3
            })
        
        applications.append({
            'id': booking.id,
            'student': {
                'id': booking.student.id,
                'name': booking.student.get_full_name() if hasattr(booking.student, 'get_full_name') else booking.student.email,
                'email': booking.student.email,
                'verification': {
                    'score': score,
                    'level': level,
                    'badge': {
                        'icon': '✓' if score >= 70 else '📧' if score >= 31 else '○',
                        'label': 'Verified' if score >= 70 else 'Basic' if score >= 31 else 'Unverified',
                        'color': 'green' if score >= 70 else 'blue' if score >= 31 else 'gray',
                    }
                },
                'highlights': highlights,
            },
            'listing': {
                'id': booking.listing.id,
                'title': booking.listing.title,
            },
            'status': booking.status,
            'created_at': booking.created_at.isoformat(),
        })
    
    # Sort by verification score (highest first) and then by date
    applications.sort(key=lambda x: (-x['student']['verification']['score'], x['created_at']), reverse=True)
    
    return Response({
        'applications': applications,
        'summary': {
            'total': len(applications),
            'verified': len([a for a in applications if a['student']['verification']['score'] >= 70]),
            'basic': len([a for a in applications if 31 <= a['student']['verification']['score'] < 70]),
            'unverified': len([a for a in applications if a['student']['verification']['score'] < 31]),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verification_sorting_options(request):
    """Get available sorting options based on verification for landlords."""
    return Response({
        'sort_options': [
            {
                'value': 'verification_desc',
                'label': 'Verification Score (High to Low)',
                'description': 'Show most verified students first',
                'icon': '✓',
            },
            {
                'value': 'verification_asc',
                'label': 'Verification Score (Low to High)',
                'description': 'Show least verified students first',
                'icon': '○',
            },
            {
                'value': 'date_desc',
                'label': 'Newest First',
                'description': 'Most recent applications first',
                'icon': '📅',
            },
            {
                'value': 'date_asc',
                'label': 'Oldest First',
                'description': 'Oldest applications first',
                'icon': '📅',
            },
        ],
        'filter_options': [
            {
                'value': 'verified_only',
                'label': 'Verified Students Only (70%+)',
                'description': 'Show only fully verified students',
                'icon': '✓',
            },
            {
                'value': 'basic_plus',
                'label': 'Basic Verified+ (31%+)',
                'description': 'Show students with at least basic verification',
                'icon': '📧',
            },
            {
                'value': 'all',
                'label': 'All Students',
                'description': 'Show all applications regardless of verification',
                'icon': '👥',
            },
        ]
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def filter_applications_by_verification(request):
    """Filter applications by verification level."""
    if request.user.role != 'landlord':
        return Response({
            'error': 'Only landlords can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)
    
    filter_type = request.data.get('filter', 'all')
    sort_by = request.data.get('sort', 'date_desc')
    
    # Get bookings
    bookings = Booking.objects.filter(
        listing__landlord=request.user
    ).select_related('student', 'listing')
    
    # Build applications list with verification
    applications = []
    for booking in bookings:
        score = access_control_engine.get_user_verification_score(booking.student)
        
        # Apply filter
        if filter_type == 'verified_only' and score < 70:
            continue
        elif filter_type == 'basic_plus' and score < 31:
            continue
        
        level = access_control_engine.get_verification_level(score)
        
        applications.append({
            'id': booking.id,
            'student': {
                'id': booking.student.id,
                'name': booking.student.get_full_name() if hasattr(booking.student, 'get_full_name') else booking.student.email,
                'verification_score': score,
                'verification_level': level,
            },
            'listing_title': booking.listing.title,
            'status': booking.status,
            'created_at': booking.created_at.isoformat(),
        })
    
    # Apply sorting
    if sort_by == 'verification_desc':
        applications.sort(key=lambda x: x['student']['verification_score'], reverse=True)
    elif sort_by == 'verification_asc':
        applications.sort(key=lambda x: x['student']['verification_score'])
    elif sort_by == 'date_desc':
        applications.sort(key=lambda x: x['created_at'], reverse=True)
    elif sort_by == 'date_asc':
        applications.sort(key=lambda x: x['created_at'])
    
    return Response({
        'applications': applications,
        'count': len(applications),
        'filter_applied': filter_type,
        'sort_applied': sort_by,
    })
