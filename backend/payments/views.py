
from rest_framework import viewsets, permissions
from .models import Payment, Escrow
from .serializers import PaymentSerializer, EscrowSerializer

class PaymentViewSet(viewsets.ModelViewSet):
	queryset = Payment.objects.all()
	serializer_class = PaymentSerializer
	permission_classes = [permissions.AllowAny]

class EscrowViewSet(viewsets.ModelViewSet):
	queryset = Escrow.objects.all()
	serializer_class = EscrowSerializer
	permission_classes = [permissions.AllowAny]
