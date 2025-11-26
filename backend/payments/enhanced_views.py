"""Enhanced payment views with verification enforcement."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from decimal import Decimal

from .models import Payment, Escrow
from .serializers import PaymentSerializer
from .access_control import payment_access_controller
from verification.decorators import verification_required


class PaymentAccessMixin:
    """Mixin to add payment access control to viewsets."""
    
    def check_payment_access(self, action_type='make_payment'):
        """
        Check if user has access to perform payment action.
        
        Args:
            action_type: 'make_payment', 'student_rates', 'priority_processing'
            
        Returns:
            Tuple of (has_access, error_response)
        """
        user = self.request.user
        
        if action_type == 'make_payment':
            can_access, reason = payment_access_controller.can_make_payment(user)
        elif action_type == 'student_rates':
            can_access, reason = payment_access_controller.can_access_student_rates(user)
        elif action_type == 'priority_processing':
            can_access, reason = payment_access_controller.can_access_priority_processing(user)
        else:
            return False, Response({'error': 'Invalid action type'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not can_access:
            return False, Response({
                'error': 'Insufficient verification',
                'message': reason,
                'required_action': 'complete_verification'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return True, None
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def access_info(self, request):
        """Get user's payment access information."""
        access = payment_access_controller.evaluate_payment_access(request.user)
        requirements = payment_access_controller.get_payment_requirements()
        benefits = payment_access_controller.get_verification_benefits(request.user)
        savings = payment_access_controller.calculate_savings_example(request.user)
        
        return Response({
            'access': {
                'can_make_payment': access.can_make_payment,
                'can_receive_payment': access.can_receive_payment,
                'can_access_student_rates': access.can_access_student_rates,
                'can_access_priority_processing': access.can_access_priority_processing,
                'can_use_escrow': access.can_use_escrow,
                'access_level': access.access_level,
                'blocking_reason': access.blocking_reason,
            },
            'requirements': requirements,
            'benefits': benefits,
            'savings_example': savings,
        })


class EnhancedPaymentViewSet(PaymentAccessMixin, viewsets.ModelViewSet):
    """Enhanced payment viewset with verification enforcement."""
    
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Users can see payments they made or received
        return Payment.objects.filter(
            models.Q(payer=user) | models.Q(payee=user)
        ).select_related('payer', 'payee', 'listing', 'booking')
    
    def create(self, request, *args, **kwargs):
        """Create payment with verification check."""
        has_access, error_response = self.check_payment_access('make_payment')
        if not has_access:
            return error_response
        
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Save payment with verification-based pricing."""
        amount = serializer.validated_data.get('amount')
        payment_type = serializer.validated_data.get('payment_type', 'rent')
        
        # Calculate pricing with student rates if applicable
        pricing = payment_access_controller.calculate_payment_pricing(
            self.request.user,
            amount,
            payment_type
        )
        
        # Apply student rate discount if applicable
        if pricing.student_rate_applied:
            serializer.validated_data['amount'] = pricing.final_amount
            # Store original amount in reference for tracking
            serializer.validated_data['reference'] = f"Original: ${amount}, Student rate applied: {pricing.discount_percentage}%"
        
        serializer.save(payer=self.request.user)
    
    @action(detail=False, methods=['post'])
    def calculate_pricing(self, request):
        """Calculate payment pricing with verification-based discounts."""
        amount = request.data.get('amount')
        payment_type = request.data.get('payment_type', 'rent')
        
        if not amount:
            return Response({
                'error': 'Amount is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount = Decimal(str(amount))
        except (ValueError, TypeError):
            return Response({
                'error': 'Invalid amount'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate pricing
        pricing = payment_access_controller.calculate_payment_pricing(
            request.user,
            amount,
            payment_type
        )
        
        return Response({
            'base_amount': str(pricing.base_amount),
            'discount_percentage': str(pricing.discount_percentage),
            'discount_amount': str(pricing.discount_amount),
            'final_amount': str(pricing.final_amount),
            'processing_fee': str(pricing.processing_fee),
            'total_amount': str(pricing.total_amount),
            'student_rate_applied': pricing.student_rate_applied,
            'verification_level': pricing.verification_level,
        })
    
    @action(detail=False, methods=['post'])
    @verification_required('student_discounts', required_score=70, api_view=True)
    def create_with_student_rate(self, request):
        """Create payment with student rate (requires 70%+ verification)."""
        # This endpoint is protected by the decorator
        # Only verified students can access it
        
        amount = request.data.get('amount')
        payee_id = request.data.get('payee_id')
        payment_type = request.data.get('payment_type', 'rent')
        
        if not amount or not payee_id:
            return Response({
                'error': 'amount and payee_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount = Decimal(str(amount))
            from users.models import User
            payee = User.objects.get(id=payee_id)
        except (ValueError, TypeError):
            return Response({
                'error': 'Invalid amount'
            }, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({
                'error': 'Payee not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Calculate pricing with student rate
        pricing = payment_access_controller.calculate_payment_pricing(
            request.user,
            amount,
            payment_type
        )
        
        # Create payment
        payment = Payment.objects.create(
            payer=request.user,
            payee=payee,
            amount=pricing.final_amount,
            payment_type=payment_type,
            reference=f"Student rate: {pricing.discount_percentage}% off (Original: ${amount})"
        )
        
        return Response({
            'success': True,
            'payment_id': payment.id,
            'message': 'Payment created with student rate',
            'pricing': {
                'original_amount': str(amount),
                'discount': str(pricing.discount_amount),
                'final_amount': str(pricing.final_amount),
                'processing_fee': str(pricing.processing_fee),
                'total': str(pricing.total_amount),
            }
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def process_priority(self, request, pk=None):
        """Process payment with priority (requires 70%+ verification)."""
        has_access, error_response = self.check_payment_access('priority_processing')
        if not has_access:
            return error_response
        
        payment = self.get_object()
        
        # Verify user is the payer
        if payment.payer != request.user:
            return Response({
                'error': 'Only the payer can process this payment'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Process payment with priority
        payment.status = 'completed'
        payment.paid_at = timezone.now()
        payment.payment_method = 'priority_processing'
        payment.save()
        
        return Response({
            'success': True,
            'message': 'Payment processed with priority',
            'payment_id': payment.id,
            'status': payment.status,
            'paid_at': payment.paid_at,
        })
    
    @action(detail=False, methods=['post'])
    def validate_verification(self, request):
        """Validate user's verification status for payment."""
        amount = request.data.get('amount', 1000)
        
        try:
            amount = Decimal(str(amount))
        except (ValueError, TypeError):
            amount = Decimal('1000')
        
        validation = payment_access_controller.validate_payment_verification(
            request.user,
            amount
        )
        
        return Response(validation)
    
    @action(detail=False, methods=['get'])
    def my_savings(self, request):
        """Get user's potential savings with student rates."""
        # Calculate savings for different amounts
        amounts = [Decimal('500'), Decimal('1000'), Decimal('2000'), Decimal('5000')]
        
        savings_breakdown = []
        for amount in amounts:
            savings = payment_access_controller.calculate_savings_example(request.user, amount)
            savings_breakdown.append(savings)
        
        return Response({
            'savings_breakdown': savings_breakdown,
            'message': 'Complete verification to unlock these savings!'
        })
    
    @action(detail=True, methods=['post'])
    def create_escrow(self, request, pk=None):
        """Create escrow for payment (requires verification)."""
        has_access, error_response = self.check_payment_access('make_payment')
        if not has_access:
            return error_response
        
        payment = self.get_object()
        
        # Check if user has escrow access
        access = payment_access_controller.evaluate_payment_access(request.user)
        if not access.can_use_escrow:
            return Response({
                'error': 'Escrow protection requires verification'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Create escrow
        escrow, created = Escrow.objects.get_or_create(payment=payment)
        
        if not created:
            return Response({
                'error': 'Escrow already exists for this payment'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'message': 'Escrow created successfully',
            'escrow_id': escrow.id,
            'payment_id': payment.id,
        }, status=status.HTTP_201_CREATED)


# Import models for Q lookup
from django.db import models
