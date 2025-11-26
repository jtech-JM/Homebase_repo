"""Listing access control with verification enforcement."""

from decimal import Decimal
from typing import Dict, List, Optional
from dataclasses import dataclass

from verification.access_control import access_control_engine


@dataclass
class ListingAccessLevel:
    """Defines access level for a listing."""
    can_view: bool = False
    can_view_details: bool = False
    can_contact_landlord: bool = False
    can_book: bool = False
    can_access_premium_features: bool = False
    access_level: str = 'none'  # none, view_only, standard, premium
    blocking_reason: Optional[str] = None


@dataclass
class PricingTier:
    """Pricing information with verification-based discounts."""
    base_price: Decimal
    discount_percentage: Decimal = Decimal('0')
    discount_amount: Decimal = Decimal('0')
    final_price: Decimal = Decimal('0')
    student_discount_applied: bool = False
    verification_level: str = 'unverified'
    
    def __post_init__(self):
        """Calculate final price after discounts."""
        if self.discount_percentage > 0:
            self.discount_amount = self.base_price * (self.discount_percentage / 100)
            self.final_price = self.base_price - self.discount_amount
        else:
            self.final_price = self.base_price


class ListingAccessController:
    """Controls access to listings based on verification status."""
    
    # Access level thresholds
    VIEW_ONLY_SCORE = 0  # Anyone can view basic listing info
    STANDARD_ACCESS_SCORE = 31  # Basic verified users
    PREMIUM_ACCESS_SCORE = 70  # Fully verified students
    
    # Student discount configuration
    STUDENT_DISCOUNT_PERCENTAGE = Decimal('15')  # 15% discount
    VERIFIED_STUDENT_DISCOUNT_PERCENTAGE = Decimal('20')  # 20% for highly verified
    
    def __init__(self):
        self.access_engine = access_control_engine
    
    def evaluate_listing_access(self, user, listing) -> ListingAccessLevel:
        """
        Evaluate user's access level to a specific listing.
        
        Args:
            user: User object
            listing: Listing object
            
        Returns:
            ListingAccessLevel with detailed access permissions
        """
        if not user or not user.is_authenticated:
            return ListingAccessLevel(
                can_view=True,
                can_view_details=False,
                can_contact_landlord=False,
                can_book=False,
                access_level='view_only',
                blocking_reason='Login required for full access'
            )
        
        # Get user's verification status
        score = self.access_engine.get_user_verification_score(user)
        permissions = self.access_engine.calculate_feature_permissions(user)
        
        # Determine if this is student housing
        is_student_housing = listing.is_student_housing if hasattr(listing, 'is_student_housing') else False
        
        # Student housing requires verification
        if is_student_housing:
            if score < self.PREMIUM_ACCESS_SCORE:
                return ListingAccessLevel(
                    can_view=True,
                    can_view_details=True,
                    can_contact_landlord=False,
                    can_book=False,
                    access_level='view_only',
                    blocking_reason=f'Student housing requires {self.PREMIUM_ACCESS_SCORE}% verification to book'
                )
            
            # Full access for verified students
            return ListingAccessLevel(
                can_view=True,
                can_view_details=True,
                can_contact_landlord=True,
                can_book=True,
                can_access_premium_features=True,
                access_level='premium'
            )
        
        # Regular housing - graduated access based on verification
        if score >= self.PREMIUM_ACCESS_SCORE:
            return ListingAccessLevel(
                can_view=True,
                can_view_details=True,
                can_contact_landlord=True,
                can_book=True,
                can_access_premium_features=True,
                access_level='premium'
            )
        elif score >= self.STANDARD_ACCESS_SCORE:
            return ListingAccessLevel(
                can_view=True,
                can_view_details=True,
                can_contact_landlord=True,
                can_book=True,
                can_access_premium_features=False,
                access_level='standard'
            )
        else:
            return ListingAccessLevel(
                can_view=True,
                can_view_details=True,
                can_contact_landlord=False,
                can_book=False,
                can_access_premium_features=False,
                access_level='view_only',
                blocking_reason='Complete basic verification to contact landlords'
            )
    
    def calculate_pricing_tier(self, user, listing, base_price: Decimal = None) -> PricingTier:
        """
        Calculate pricing with verification-based discounts.
        
        Args:
            user: User object
            listing: Listing object (optional)
            base_price: Base price for the listing (optional, will use listing.price if not provided)
            
        Returns:
            PricingTier with discount information
        """
        # Get base price from listing if not provided
        if base_price is None and listing is not None:
            base_price = listing.price if hasattr(listing, 'price') else Decimal('100.00')
        elif base_price is None:
            base_price = Decimal('100.00')
        
        if not user or not user.is_authenticated:
            return PricingTier(
                base_price=base_price,
                verification_level='guest'
            )
        
        # Get user's verification status
        score = self.access_engine.get_user_verification_score(user)
        level = self.access_engine.get_verification_level(score)
        permissions = self.access_engine.calculate_feature_permissions(user)
        
        # Check if user qualifies for student discounts
        if not permissions.can_access_student_discounts:
            return PricingTier(
                base_price=base_price,
                verification_level=level
            )
        
        # Apply appropriate discount based on verification level
        if score >= self.PREMIUM_ACCESS_SCORE:
            # Highly verified students get better discount
            discount = self.VERIFIED_STUDENT_DISCOUNT_PERCENTAGE
        else:
            # Basic verified students get standard discount
            discount = self.STUDENT_DISCOUNT_PERCENTAGE
        
        return PricingTier(
            base_price=base_price,
            discount_percentage=discount,
            student_discount_applied=True,
            verification_level=level
        )
    
    def filter_listings_by_access(self, user, listings_queryset):
        """
        Filter listings based on user's verification level.
        
        Args:
            user: User object
            listings_queryset: Django queryset of listings
            
        Returns:
            Filtered queryset with access annotations
        """
        if not user or not user.is_authenticated:
            # Guest users can see all listings but with limited info
            return listings_queryset
        
        score = self.access_engine.get_user_verification_score(user)
        
        # For now, return all listings but they'll have access control applied
        # In the future, we could filter out certain premium listings
        return listings_queryset
    
    def get_listing_access_requirements(self, listing) -> Dict:
        """
        Get verification requirements for a listing.
        
        Args:
            listing: Listing object
            
        Returns:
            Dictionary with access requirements
        """
        is_student_housing = listing.is_student_housing if hasattr(listing, 'is_student_housing') else False
        
        if is_student_housing:
            return {
                'required_score': self.PREMIUM_ACCESS_SCORE,
                'required_level': 'verified',
                'required_methods': ['university_email', 'student_id_upload'],
                'benefits': [
                    'Book student housing',
                    'Access student discounts (15-20%)',
                    'Contact verified landlords',
                    'Priority booking access'
                ]
            }
        else:
            return {
                'required_score': self.STANDARD_ACCESS_SCORE,
                'required_level': 'basic',
                'required_methods': ['university_email'],
                'benefits': [
                    'Contact landlords',
                    'Book properties',
                    'Access student discounts'
                ]
            }
    
    def get_verification_benefits_for_listing(self, user, listing) -> List[str]:
        """
        Get list of benefits user would gain by verifying for this listing.
        
        Args:
            user: User object
            listing: Listing object
            
        Returns:
            List of benefit descriptions
        """
        if not user or not user.is_authenticated:
            return [
                'Login to see personalized benefits',
                'Complete verification for student discounts',
                'Access exclusive student housing'
            ]
        
        current_access = self.evaluate_listing_access(user, listing)
        score = self.access_engine.get_user_verification_score(user)
        
        benefits = []
        
        # Benefits they don't have yet
        if not current_access.can_contact_landlord:
            benefits.append('Contact landlord directly')
        
        if not current_access.can_book:
            benefits.append('Book this property')
        
        if not current_access.can_access_premium_features:
            benefits.append('Access premium features')
        
        # Discount benefits
        pricing = self.calculate_pricing_tier(user, listing, Decimal('100'))
        if not pricing.student_discount_applied:
            benefits.append('Unlock 15-20% student discount')
        elif score < self.PREMIUM_ACCESS_SCORE:
            benefits.append('Increase discount to 20% with full verification')
        
        # Additional benefits for higher verification
        if score < self.PREMIUM_ACCESS_SCORE:
            benefits.extend([
                'Priority booking access',
                'Verified student badge',
                'Access to verified-only listings'
            ])
        
        return benefits if benefits else ['You have full access to this listing!']


# Global instance
listing_access_controller = ListingAccessController()
