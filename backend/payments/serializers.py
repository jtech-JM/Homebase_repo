from rest_framework import serializers
from .models import Payment, Escrow

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"

class EscrowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Escrow
        fields = "__all__"
