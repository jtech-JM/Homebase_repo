"""Enhanced listing views with verification-based access control."""

from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.db.models import Q
from decimal import Decimal
import json

from .models import Listing
from .access_control import listing_access_controller
from verification.access_control import access_control_engine


def listing_list_with_access_control(request):
    """List all listings with verification-based access control."""
    # Get all listings
    listings = Listing.objects.all().order_by('-created_at')
    
    # Apply search filters
    search_query = request.GET.get('search', '')
    if search_query:
        listings = listings.filter(
            Q(title__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(location__icontains=search_query)
        )
    
    # Filter by student housing if requested
    student_only = request.GET.get('student_only', '') == 'true'
    if student_only:
        listings = listings.filter(
            Q(title__icontains='student') |
            Q(description__icontains='student') |
            Q(description__icontains='university')
        )
    
    # Apply verification-based filtering
    if request.user.is_authenticated:
        listings = listing_access_controller.filter_listings_by_access(
            request.user, 
            listings
        )
    
    # Pagination
    paginator = Paginator(listings, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Add access information to each listing
    listings_with_access = []
    for listing in page_obj:
        access_level = listing_access_controller.evaluate_listing_access(
            request.user if request.user.is_authenticated else None,
            listing
        )
        
        pricing = listing_access_controller.calculate_pricing_tier(
            request.user if request.user.is_authenticated else None,
            listing,
            listing.price_per_night or Decimal('100.00')
        )
        
        listings_with_access.append({
            'listing': listing,
            'access': access_level,
            'pricing': pricing,
        })
    
    # Get user's verification status
    user_permissions = None
    if request.user.is_authenticated:
        user_permissions = access_control_engine.calculate_feature_permissions(request.user)
    
    context = {
        'page_obj': page_obj,
        'listings_with_access': listings_with_access,
        'user_permissions': user_permissions,
        'search_query': search_query,
        'student_only': student_only,
    }
    
    return render(request, 'listings/listing_list_enhanced.html', context)


def listing_detail_with_access_control(request, listing_id):
    """View listing details with verification-based access control."""
    listing = get_object_or_404(Listing, id=listing_id)
    
    # Evaluate access level
    access_level = listing_access_controller.evaluate_listing_access(
        request.user if request.user.is_authenticated else None,
        listing
    )
    
    # Calculate pricing with discounts
    base_price = listing.price_per_night or Decimal('100.00')
    pricing = listing_access_controller.calculate_pricing_tier(
        request.user if request.user.is_authenticated else None,
        listing,
        base_price
    )
    
    # Get verification requirements
    requirements = listing_access_controller.get_listing_access_requirements(listing)
    
    # Get benefits of verification
    benefits = listing_access_controller.get_verification_benefits_for_listing(
        request.user if request.user.is_authenticated else None,
        listing
    )
    
    # Get user's verification status
    user_permissions = None
    verification_score = 0
    if request.user.is_authenticated:
        user_permissions = access_control_engine.calculate_feature_permissions(request.user)
        verification_score = access_control_engine.get_user_verification_score(request.user)
    
    context = {
        'listing': listing,
        'access_level': access_level,
        'pricing': pricing,
        'requirements': requirements,
        'benefits': benefits,
        'user_permissions': user_permissions,
        'verification_score': verification_score,
    }
    
    return render(request, 'listings/listing_detail_enhanced.html', context)


@require_http_methods(["GET"])
def listing_access_check_api(request, listing_id):
    """API endpoint to check access level for a listing."""
    listing = get_object_or_404(Listing, id=listing_id)
    
    if not request.user.is_authenticated:
        return JsonResponse({
            'authenticated': False,
            'access_level': 'guest',
            'message': 'Login required for full access'
        })
    
    # Evaluate access
    access_level = listing_access_controller.evaluate_listing_access(
        request.user,
        listing
    )
    
    # Get pricing
    pricing = listing_access_controller.calculate_pricing_tier(
        request.user,
        listing,
        listing.price_per_night or Decimal('100.00')
    )
    
    return JsonResponse({
        'authenticated': True,
        'listing_id': listing.id,
        'access': {
            'can_view': access_level.can_view,
            'can_view_details': access_level.can_view_details,
            'can_contact_landlord': access_level.can_contact_landlord,
            'can_book': access_level.can_book,
            'can_access_premium_features': access_level.can_access_premium_features,
            'access_level': access_level.access_level,
            'blocking_reason': access_level.blocking_reason,
        },
        'pricing': {
            'base_price': str(pricing.base_price),
            'discount_percentage': str(pricing.discount_percentage),
            'discount_amount': str(pricing.discount_amount),
            'final_price': str(pricing.final_price),
            'student_discount_applied': pricing.student_discount_applied,
        },
        'verification': {
            'score': access_control_engine.get_user_verification_score(request.user),
            'level': pricing.verification_level,
        }
    })


@require_http_methods(["GET"])
def listing_pricing_api(request, listing_id):
    """API endpoint to get pricing information with discounts."""
    listing = get_object_or_404(Listing, id=listing_id)
    
    base_price = listing.price_per_night or Decimal('100.00')
    
    if not request.user.is_authenticated:
        return JsonResponse({
            'base_price': str(base_price),
            'final_price': str(base_price),
            'discount_applied': False,
            'message': 'Login and verify to unlock student discounts'
        })
    
    # Calculate pricing with discounts
    pricing = listing_access_controller.calculate_pricing_tier(
        request.user,
        listing,
        base_price
    )
    
    return JsonResponse({
        'listing_id': listing.id,
        'base_price': str(pricing.base_price),
        'discount_percentage': str(pricing.discount_percentage),
        'discount_amount': str(pricing.discount_amount),
        'final_price': str(pricing.final_price),
        'student_discount_applied': pricing.student_discount_applied,
        'verification_level': pricing.verification_level,
        'savings': str(pricing.discount_amount) if pricing.student_discount_applied else '0.00',
    })


@login_required
@require_http_methods(["GET"])
def my_verification_benefits_api(request):
    """API endpoint to get user's verification benefits across all listings."""
    permissions = access_control_engine.calculate_feature_permissions(request.user)
    score = access_control_engine.get_user_verification_score(request.user)
    level = access_control_engine.get_verification_level(score)
    
    # Calculate potential savings
    sample_price = Decimal('100.00')
    pricing = listing_access_controller.calculate_pricing_tier(
        request.user,
        None,  # Generic calculation
        sample_price
    )
    
    return JsonResponse({
        'verification_status': {
            'score': score,
            'level': level,
            'percentage': score,
        },
        'access_levels': {
            'can_book_student_housing': permissions.can_book_student_housing,
            'can_book_premium_housing': permissions.can_book_premium_housing,
            'can_access_student_discounts': permissions.can_access_student_discounts,
            'can_access_priority_features': permissions.can_access_priority_features,
            'can_access_community': permissions.can_access_community,
        },
        'discounts': {
            'eligible': pricing.student_discount_applied,
            'percentage': str(pricing.discount_percentage),
            'example_savings': str(pricing.discount_amount),
        },
        'next_milestone': get_next_verification_milestone(score),
    })


def get_next_verification_milestone(current_score: int) -> dict:
    """Get information about the next verification milestone."""
    if current_score < 31:
        return {
            'target_score': 31,
            'target_level': 'basic',
            'points_needed': 31 - current_score,
            'benefits': [
                'Contact landlords',
                'Book properties',
                'Access community features'
            ]
        }
    elif current_score < 70:
        return {
            'target_score': 70,
            'target_level': 'verified',
            'points_needed': 70 - current_score,
            'benefits': [
                'Book student housing',
                'Unlock 15-20% discounts',
                'Priority booking access',
                'Verified student badge'
            ]
        }
    else:
        return {
            'target_score': 100,
            'target_level': 'fully_verified',
            'points_needed': 100 - current_score,
            'benefits': [
                'Maximum discounts',
                'Premium features',
                'Exclusive listings'
            ]
        }


@require_http_methods(["POST"])
def contact_landlord_with_verification(request, listing_id):
    """Contact landlord with verification enforcement."""
    if not request.user.is_authenticated:
        return JsonResponse({
            'error': 'Authentication required'
        }, status=401)
    
    listing = get_object_or_404(Listing, id=listing_id)
    
    # Check access level
    access_level = listing_access_controller.evaluate_listing_access(
        request.user,
        listing
    )
    
    if not access_level.can_contact_landlord:
        return JsonResponse({
            'error': 'Insufficient verification',
            'message': access_level.blocking_reason,
            'required_action': 'complete_verification'
        }, status=403)
    
    try:
        data = json.loads(request.body)
        message = data.get('message', '')
        
        if not message:
            return JsonResponse({
                'error': 'Message is required'
            }, status=400)
        
        # Here you would implement actual messaging logic
        # For now, we'll just return success
        
        return JsonResponse({
            'success': True,
            'message': 'Message sent to landlord',
            'verification_badge_included': True,
            'user_verification_level': access_control_engine.get_verification_level(
                access_control_engine.get_user_verification_score(request.user)
            )
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)
