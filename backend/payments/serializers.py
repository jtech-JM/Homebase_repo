"""Serializers for payment models."""

from rest_framework import serializers
from .models import Payment, Escrow


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    
    payer_email = serializers.EmailField(source='payer.email', read_only=True)
    payee_email = serializers.EmailField(source='payee.email', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payer', 'payer_email', 'payee', 'payee_email',
            'amount', 'status', 'payment_type', 'created_at', 'updated_at',
            'reference', 'listing', 'booking', 'due_date', 'paid_at',
            'payment_method', 'gateway_transaction_id'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'payer']


class EscrowSerializer(serializers.ModelSerializer):
    """Serializer for Escrow model."""
    
    payment_details = PaymentSerializer(source='payment', read_only=True)
    
    class Meta:
        model = Escrow
        fields = ['id', 'payment', 'payment_details', 'released', 'released_at']
        read_only_fields = ['id', 'released_at']
