"""Payment access control with verification enforcement."""

from decimal import Decimal
from dataclasses import dataclass
from typing import Optional

from verification.access_control import access_control_engine


@dataclass
class PaymentAccessLevel:
    """Defines access level for payment features."""
    can_make_payment: bool = False
    can_receive_payment: bool = False
    can_access_student_rates: bool = False
    can_access_priority_processing: bool = False
    can_use_escrow: bool = False
    access_level: str = 'none'  # none, basic, verified, premium
    blocking_reason: Optional[str] = None


@dataclass
class PaymentPricingTier:
    """Payment pricing with verification-based discounts."""
    base_amount: Decimal
    discount_percentage: Decimal = Decimal('0')
    discount_amount: Decimal = Decimal('0')
    final_amount: Decimal = Decimal('0')
    student_rate_applied: bool = False
    processing_fee: Decimal = Decimal('0')
    total_amount: Decimal = Decimal('0')
    verification_level: str = 'unverified'
    
    def __post_init__(self):
        """Calculate final amounts."""
        if self.discount_percentage > 0:
            self.discount_amount = self.base_amount * (self.discount_percentage / 100)
            self.final_amount = self.base_amount - self.discount_amount
        else:
            self.final_amount = self.base_amount
        
        # Add processing fee
        self.total_amount = self.final_amount + self.processing_fee


class PaymentAccessController:
    """Controls access to payment features based on verification status."""
    
    # Access level thresholds
    BASIC_PAYMENT_SCORE = 31  # Basic verified users
    STUDENT_RATE_SCORE = 70  # Fully verified students
    PRIORITY_PROCESSING_SCORE = 70  # Priority features
    
    # Student rate discounts
    STUDENT_RATE_DISCOUNT = Decimal('10')  # 10% discount on payments
    VERIFIED_STUDENT_DISCOUNT = Decimal('15')  # 15% for highly verified
    
    # Processing fees
    STANDARD_PROCESSING_FEE_PERCENT = Decimal('2.9')  # 2.9%
    PRIORITY_PROCESSING_FEE_PERCENT = Decimal('1.9')  # 1.9% for verified
    
    def __init__(self):
        self.access_engine = access_control_engine
    
    def evaluate_payment_access(self, user) -> PaymentAccessLevel:
        """
        Evaluate user's access level to payment features.
        
        Args:
            user: User object
            
        Returns:
            PaymentAccessLevel with detailed access permissions
        """
        if not user or not user.is_authenticated:
            return PaymentAccessLevel(
                can_make_payment=False,
                can_receive_payment=False,
                can_access_student_rates=False,
                can_access_priority_processing=False,
                can_use_escrow=False,
                access_level='guest',
                blocking_reason='Login required for payment features'
            )
        
        # Get user's verification status
        score = self.access_engine.get_user_verification_score(user)
        permissions = self.access_engine.calculate_feature_permissions(user)
        
        # Basic payment access (31%+)
        if score >= self.BASIC_PAYMENT_SCORE and score < self.STUDENT_RATE_SCORE:
            return PaymentAccessLevel(
                can_make_payment=True,
                can_receive_payment=True,
                can_access_student_rates=False,
                can_access_priority_processing=False,
                can_use_escrow=True,
                access_level='basic'
            )
        
        # Verified student access (70%+)
        if score >= self.STUDENT_RATE_SCORE:
            return PaymentAccessLevel(
                can_make_payment=True,
                can_receive_payment=True,
                can_access_student_rates=True,
                can_access_priority_processing=True,
                can_use_escrow=True,
                access_level='verified'
            )
        
        # Unverified users
        return PaymentAccessLevel(
            can_make_payment=False,
            can_receive_payment=False,
            can_access_student_rates=False,
            can_access_priority_processing=False,
            can_use_escrow=False,
            access_level='unverified',
            blocking_reason='Complete verification to access payment features'
        )
    
    def calculate_payment_pricing(
        self, 
        user, 
        base_amount: Decimal,
        payment_type: str = 'rent'
    ) -> PaymentPricingTier:
        """
        Calculate payment pricing with verification-based discounts.
        
        Args:
            user: User object
            base_amount: Base payment amount
            payment_type: Type of payment (rent, deposit, fee, etc.)
            
        Returns:
            PaymentPricingTier with discount and fee information
        """
        if not user or not user.is_authenticated:
            return PaymentPricingTier(
                base_amount=base_amount,
                processing_fee=base_amount * (self.STANDARD_PROCESSING_FEE_PERCENT / 100),
                verification_level='guest'
            )
        
        # Get user's verification status
        score = self.access_engine.get_user_verification_score(user)
        level = self.access_engine.get_verification_level(score)
        permissions = self.access_engine.calculate_feature_permissions(user)
        
        # Calculate processing fee based on verification
        if score >= self.PRIORITY_PROCESSING_SCORE:
            processing_fee_percent = self.PRIORITY_PROCESSING_FEE_PERCENT
        else:
            processing_fee_percent = self.STANDARD_PROCESSING_FEE_PERCENT
        
        processing_fee = base_amount * (processing_fee_percent / 100)
        
        # Check if user qualifies for student rates
        if not permissions.can_access_student_discounts:
            return PaymentPricingTier(
                base_amount=base_amount,
                processing_fee=processing_fee,
                verification_level=level
            )
        
        # Apply student rate discount
        if score >= self.STUDENT_RATE_SCORE:
            discount = self.VERIFIED_STUDENT_DISCOUNT
        else:
            discount = self.STUDENT_RATE_DISCOUNT
        
        return PaymentPricingTier(
            base_amount=base_amount,
            discount_percentage=discount,
            student_rate_applied=True,
            processing_fee=processing_fee,
            verification_level=level
        )
    
    def can_make_payment(self, user) -> tuple[bool, Optional[str]]:
        """
        Check if user can make payments.
        
        Returns:
            Tuple of (can_make, blocking_reason)
        """
        access = self.evaluate_payment_access(user)
        return access.can_make_payment, access.blocking_reason
    
    def can_access_student_rates(self, user) -> tuple[bool, Optional[str]]:
        """
        Check if user can access student rates.
        
        Returns:
            Tuple of (can_access, blocking_reason)
        """
        if not user or not user.is_authenticated:
            return False, 'Login required'
        
        score = self.access_engine.get_user_verification_score(user)
        
        if score < self.STUDENT_RATE_SCORE:
            return False, f'Student rates require {self.STUDENT_RATE_SCORE}% verification'
        
        return True, None
    
    def can_access_priority_processing(self, user) -> tuple[bool, Optional[str]]:
        """
        Check if user can access priority payment processing.
        
        Returns:
            Tuple of (can_access, blocking_reason)
        """
        if not user or not user.is_authenticated:
            return False, 'Login required'
        
        score = self.access_engine.get_user_verification_score(user)
        
        if score < self.PRIORITY_PROCESSING_SCORE:
            return False, f'Priority processing requires {self.PRIORITY_PROCESSING_SCORE}% verification'
        
        return True, None
    
    def validate_payment_verification(self, user, amount: Decimal) -> dict:
        """
        Validate user's verification status for payment processing.
        
        Args:
            user: User object
            amount: Payment amount
            
        Returns:
            Dictionary with validation results
        """
        access = self.evaluate_payment_access(user)
        pricing = self.calculate_payment_pricing(user, amount)
        
        return {
            'valid': access.can_make_payment,
            'access_level': access.access_level,
            'blocking_reason': access.blocking_reason,
            'pricing': {
                'base_amount': str(pricing.base_amount),
                'discount_percentage': str(pricing.discount_percentage),
                'discount_amount': str(pricing.discount_amount),
                'final_amount': str(pricing.final_amount),
                'processing_fee': str(pricing.processing_fee),
                'total_amount': str(pricing.total_amount),
                'student_rate_applied': pricing.student_rate_applied,
            },
            'features': {
                'student_rates': access.can_access_student_rates,
                'priority_processing': access.can_access_priority_processing,
                'escrow_protection': access.can_use_escrow,
            }
        }
    
    def get_payment_requirements(self) -> dict:
        """Get verification requirements for payment features."""
        return {
            'basic_payment': {
                'required_score': self.BASIC_PAYMENT_SCORE,
                'required_level': 'basic',
                'required_methods': ['university_email'],
                'features': [
                    'Make payments',
                    'Receive payments',
                    'Escrow protection',
                    'Standard processing fees'
                ]
            },
            'student_rates': {
                'required_score': self.STUDENT_RATE_SCORE,
                'required_level': 'verified',
                'required_methods': ['university_email', 'student_id_upload'],
                'features': [
                    'All basic features',
                    'Student rate discounts (10-15%)',
                    'Priority payment processing',
                    'Reduced processing fees (1.9%)',
                    'Verified student badge'
                ]
            }
        }
    
    def get_verification_benefits(self, user) -> list[str]:
        """
        Get list of payment benefits user would gain by verifying.
        
        Args:
            user: User object
            
        Returns:
            List of benefit descriptions
        """
        if not user or not user.is_authenticated:
            return [
                'Login to access payment features',
                'Verify to unlock student rates',
                'Complete full verification for priority processing'
            ]
        
        current_access = self.evaluate_payment_access(user)
        score = self.access_engine.get_user_verification_score(user)
        
        benefits = []
        
        # Benefits they don't have yet
        if not current_access.can_make_payment:
            benefits.append('Make and receive payments')
        
        if not current_access.can_access_student_rates:
            benefits.append('Access student rate discounts (10-15%)')
        
        if not current_access.can_access_priority_processing:
            benefits.extend([
                'Priority payment processing',
                'Reduced processing fees (1.9% vs 2.9%)'
            ])
        
        if not current_access.can_use_escrow:
            benefits.append('Escrow protection for secure payments')
        
        # Additional benefits for higher verification
        if score < self.STUDENT_RATE_SCORE:
            benefits.extend([
                'Verified payment badge',
                'Enhanced payment security',
                'Priority customer support'
            ])
        
        return benefits if benefits else ['You have full payment access!']
    
    def calculate_savings_example(self, user, sample_amount: Decimal = Decimal('1000')) -> dict:
        """
        Calculate example savings with student rates.
        
        Args:
            user: User object
            sample_amount: Sample payment amount for calculation
            
        Returns:
            Dictionary with savings breakdown
        """
        # Standard pricing (no verification)
        standard_pricing = PaymentPricingTier(
            base_amount=sample_amount,
            processing_fee=sample_amount * (self.STANDARD_PROCESSING_FEE_PERCENT / 100),
            verification_level='unverified'
        )
        
        # Student rate pricing
        student_pricing = self.calculate_payment_pricing(user, sample_amount)
        
        # Calculate savings
        amount_saved = standard_pricing.final_amount - student_pricing.final_amount
        fee_saved = standard_pricing.processing_fee - student_pricing.processing_fee
        total_saved = amount_saved + fee_saved
        
        return {
            'sample_amount': str(sample_amount),
            'standard_total': str(standard_pricing.total_amount),
            'student_total': str(student_pricing.total_amount),
            'amount_saved': str(amount_saved),
            'fee_saved': str(fee_saved),
            'total_saved': str(total_saved),
            'savings_percentage': str(round((total_saved / standard_pricing.total_amount) * 100, 2)) if standard_pricing.total_amount > 0 else '0'
        }


# Global instance
payment_access_controller = PaymentAccessController()
