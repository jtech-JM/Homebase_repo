
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Payment, Escrow
from .serializers import PaymentSerializer, EscrowSerializer

class PaymentViewSet(viewsets.ModelViewSet):
	queryset = Payment.objects.all()
	serializer_class = PaymentSerializer
	permission_classes = [permissions.IsAuthenticated]

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
