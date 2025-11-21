from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import SupportTicket, SupportMessage
from .serializers import (
    SupportTicketSerializer,
    SupportTicketCreateSerializer,
    SupportMessageCreateSerializer,
    SupportMessageSerializer
)

class SupportTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'priority']

    def get_serializer_class(self):
        if self.action == 'create':
            return SupportTicketCreateSerializer
        return SupportTicketSerializer

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        ticket = self.get_object()
        serializer = SupportMessageCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Determine sender based on user role
            user = request.user
            if hasattr(user, 'role'):
                sender = user.role.lower()
            else:
                # Default to 'student' if no role is set
                sender = 'student'

            SupportMessage.objects.create(
                ticket=ticket,
                sender=sender,
                content=serializer.validated_data['content']
            )
            return Response({'status': 'Message sent'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
