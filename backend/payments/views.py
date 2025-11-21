from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from datetime import datetime, timedelta
from .models import Payment, Escrow
from .serializers import PaymentSerializer, EscrowSerializer

class PaymentViewSet(viewsets.ModelViewSet):
	queryset = Payment.objects.all()
	serializer_class = PaymentSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		user = self.request.user
		# Return payments where user is either payer or payee
		return Payment.objects.filter(Q(payer=user) | Q(payee=user))

	@action(detail=False, methods=['get'])
	def student(self, request):
		"""Get payments for student (where student is payer)"""
		if request.user.role != 'student':
			return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

		status_filter = request.query_params.get('status', 'all')
		payments = Payment.objects.filter(payer=request.user)

		if status_filter != 'all':
			payments = payments.filter(status=status_filter)

		serializer = PaymentSerializer(payments, many=True)
		return Response(serializer.data)

	@action(detail=False, methods=['get'])
	def student_upcoming(self, request):
		"""Get upcoming payments for student"""
		if request.user.role != 'student':
			return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

		# Get pending payments with due dates in the future
		upcoming = Payment.objects.filter(
			payer=request.user,
			status='pending',
			due_date__gte=datetime.now()
		).order_by('due_date')

		serializer = PaymentSerializer(upcoming, many=True)
		return Response(serializer.data)

	@action(detail=True, methods=['post'])
	def pay(self, request, pk=None):
		"""Process payment for a specific payment"""
		payment = self.get_object()

		# Check if user is the payer
		if payment.payer != request.user:
			return Response({'error': 'Not authorized to pay this payment'}, status=status.HTTP_403_FORBIDDEN)

		if payment.status != 'pending':
			return Response({'error': 'Payment is not in pending status'}, status=status.HTTP_400_BAD_REQUEST)

		# Here you would integrate with payment gateway (Stripe, PayPal, etc.)
		# For now, we'll just mark as completed
		payment.status = 'completed'
		payment.paid_at = datetime.now()
		payment.save()

		serializer = PaymentSerializer(payment)
		return Response(serializer.data)

	@action(detail=False, methods=['get'])
	def financials(self, request):
		if request.user.role != 'landlord':
			return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

		total_revenue = Payment.objects.filter(payee=request.user, status='completed').aggregate(total=Sum('amount'))['total'] or 0
		pending_payments = Payment.objects.filter(payee=request.user, status='pending').aggregate(total=Sum('amount'))['total'] or 0
		paid_payments = Payment.objects.filter(payee=request.user, status='completed').aggregate(total=Sum('amount'))['total'] or 0

		# For simplicity, monthlyStats can be empty or calculated if needed
		monthly_stats = []

		return Response({
			'totalRevenue': total_revenue,
			'pendingPayments': pending_payments,
			'paidPayments': paid_payments,
			'monthlyStats': monthly_stats,
		})

	@action(detail=False, methods=['get'])
	def transactions(self, request):
		if request.user.role != 'landlord':
			return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

		status_filter = request.query_params.get('status', 'all')
		transactions = Payment.objects.filter(payee=request.user)
		if status_filter != 'all':
			transactions = transactions.filter(status=status_filter)

		serializer = PaymentSerializer(transactions, many=True)
		return Response(serializer.data)

class EscrowViewSet(viewsets.ModelViewSet):
	queryset = Escrow.objects.all()
	serializer_class = EscrowSerializer
	permission_classes = [permissions.AllowAny]
