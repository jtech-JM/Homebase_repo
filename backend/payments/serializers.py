from rest_framework import serializers
from .models import Payment, Escrow

class PaymentSerializer(serializers.ModelSerializer):
    payer_name = serializers.CharField(source='payer.get_full_name', read_only=True)
    payee_name = serializers.CharField(source='payee.get_full_name', read_only=True)
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'payer', 'payer_name', 'payee', 'payee_name', 'amount', 'status',
            'payment_type', 'created_at', 'updated_at', 'reference', 'listing',
            'listing_title', 'booking', 'booking_id', 'due_date', 'paid_at',
            'payment_method', 'gateway_transaction_id'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'paid_at']

class EscrowSerializer(serializers.ModelSerializer):
    payment_details = PaymentSerializer(source='payment', read_only=True)

    class Meta:
        model = Escrow
        fields = ['id', 'payment', 'payment_details', 'released', 'released_at']
        read_only_fields = ['id', 'released_at']
