from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db.models import Q, Max
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    def perform_create(self, serializer):
        conversation = serializer.save()
        conversation.participants.add(self.request.user)

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        conversations = self.get_queryset().annotate(
            last_message_time=Max('messages__created_at')
        ).order_by('-last_message_time')

        # Add unread count and last message for each conversation
        conversations_data = []
        for conv in conversations:
            last_message = conv.messages.order_by('-created_at').first()
            unread_count = conv.messages.filter(
                ~Q(sender=request.user) & Q(is_read=False)
            ).count()

            # Get the other participant
            other_participant = conv.participants.exclude(id=request.user.id).first()

            conv_data = ConversationSerializer(conv).data
            conv_data.update({
                'last_message': last_message.content if last_message else None,
                'unread_count': unread_count,
                'participant': {
                    'id': other_participant.id,
                    'name': other_participant.get_full_name() or other_participant.email,
                    'avatar': None,  # Add avatar field if implemented
                }
            })
            conversations_data.append(conv_data)

        return Response(conversations_data)

class MessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        messages = conversation.messages.all()

        # Mark messages as read
        messages.filter(~Q(sender=request.user)).update(is_read=True)

        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)

        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(conversation=conversation, sender=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
