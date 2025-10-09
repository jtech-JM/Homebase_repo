
from rest_framework import serializers
from .models import Verification, Review, Message

class VerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Verification
        fields = "__all__"
        read_only_fields = ["user", "status", "submitted_at", "reviewed_at", "approver", "rejection_reason"]

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = "__all__"

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = "__all__"
