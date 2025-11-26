"""API views for listing access control with verification enforcement."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from decimal import Decimal

from .models import Listing
from .access_control import listing_access_controller
from verification.access_control import access_control_engine


class ListingAccessControlMixin:
    """Mixin to add access control to listing viewsets."""
    
    def get_listing_with_access(self, listing):
        """Get listing data with access control information."""
        user = self.request.user if self.request.user.is_authenticated else None
        
        # Evaluate access level
        access_level = listing_access_controller.evaluate_listing_access(user, listing)
        
        # Calculate pricing
        pricing = listing_access_controller.calculate_pricing_tier(user, listing)
        
        # Get requirements and benefits
        requirements = listing_access_controller.get_listing_access_requirements(listing)
        benefits = listing_access_controller.get_verification_benefits_for_listing(user, listing)
        
        return {
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
                'verification_level': pricing.verification_level,
            },
            'requirements': requirements,
            'benefits': benefits,
        }
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def access_check(self, request, pk=None):
        """Check access level for a specific listing."""
        listing = self.get_object()
        access_data = self.get_listing_with_access(listing)
        
        return Response({
            'listing_id': listing.id,
            **access_data,
            'user_authenticated': request.user.is_authenticated,
        })
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def pricing(self, request, pk=None):
        """Get pricing information with discounts."""
        listing = self.get_object()
        user = request.user if request.user.is_authenticated else None
        
        pricing = listing_access_controller.calculate_pricing_tier(user, listing)
        
        return Response({
            'listing_id': listing.id,
            'base_price': str(pricing.base_price),
            'discount_percentage': str(pricing.discount_percentage),
            'discount_amount': str(pricing.discount_amount),
            'final_price': str(pricing.final_price),
            'student_discount_applied': pricing.student_discount_applied,
            'verification_level': pricing.verification_level,
            'savings': str(pricing.discount_amount) if pricing.student_discount_applied else '0.00',
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_benefits(self, request):
        """Get user's verification benefits across all listings."""
        permissions = access_control_engine.calculate_feature_permissions(request.user)
        score = access_control_engine.get_user_verification_score(request.user)
        level = access_control_engine.get_verification_level(score)
        
        # Calculate potential savings
        sample_price = Decimal('100.00')
        pricing = listing_access_controller.calculate_pricing_tier(
            request.user,
            None,
            sample_price
        )
        
        # Get next milestone
        next_milestone = self._get_next_milestone(score)
        
        return Response({
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
            'next_milestone': next_milestone,
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def contact_landlord(self, request, pk=None):
        """Contact landlord with verification enforcement."""
        listing = self.get_object()
        
        # Check access level
        access_level = listing_access_controller.evaluate_listing_access(
            request.user,
            listing
        )
        
        if not access_level.can_contact_landlord:
            return Response({
                'error': 'Insufficient verification',
                'message': access_level.blocking_reason,
                'required_action': 'complete_verification'
            }, status=status.HTTP_403_FORBIDDEN)
        
        message = request.data.get('message', '')
        
        if not message:
            return Response({
                'error': 'Message is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Here you would implement actual messaging logic
        # For now, we'll just return success
        
        return Response({
            'success': True,
            'message': 'Message sent to landlord',
            'verification_badge_included': True,
            'user_verification_level': access_control_engine.get_verification_level(
                access_control_engine.get_user_verification_score(request.user)
            )
        })
    
    def _get_next_milestone(self, current_score: int) -> dict:
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
    
    def list(self, request, *args, **kwargs):
        """Override list to add access control information."""
        response = super().list(request, *args, **kwargs)
        
        # Add access control info to each listing
        if isinstance(response.data, dict) and 'results' in response.data:
            listings = response.data['results']
        else:
            listings = response.data
        
        for listing_data in listings:
            if 'id' in listing_data:
                try:
                    listing = Listing.objects.get(id=listing_data['id'])
                    access_info = self.get_listing_with_access(listing)
                    listing_data['access_control'] = access_info
                except Listing.DoesNotExist:
                    pass
        
        return response
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to add access control information."""
        response = super().retrieve(request, *args, **kwargs)
        
        listing = self.get_object()
        access_info = self.get_listing_with_access(listing)
        response.data['access_control'] = access_info
        
        return response
