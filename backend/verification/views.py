
from rest_framework import viewsets, permissions
from .models import Verification, Review, Message
from .serializers import VerificationSerializer, ReviewSerializer, MessageSerializer

class VerificationViewSet(viewsets.ModelViewSet):
	queryset = Verification.objects.all()
	serializer_class = VerificationSerializer
	permission_classes = [permissions.IsAuthenticated]

	def perform_create(self, serializer):
		serializer.save(user = self.request.user)

class ReviewViewSet(viewsets.ModelViewSet):
	queryset = Review.objects.all()
	serializer_class = ReviewSerializer
	permission_classes = [permissions.AllowAny]

class MessageViewSet(viewsets.ModelViewSet):
	queryset = Message.objects.all()
	serializer_class = MessageSerializer
	permission_classes = [permissions.AllowAny]
