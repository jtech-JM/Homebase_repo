from rest_framework import viewsets, status, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db.models import Q, Max
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from verification.access_control import access_control_engine
from listings.models import Listing

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    def perform_create(self, serializer):
        # Check if this is a conversation about a listing (student contacting landlord)
        listing_id = self.request.data.get('listing')
        
        if listing_id:
            try:
                listing = Listing.objects.get(id=listing_id)
                
                # If student is contacting landlord about student housing, require verification
                if self.request.user.role == 'student' and listing.is_student_housing:
                    decision = access_control_engine.evaluate_access(
                        self.request.user,
                        'contact_landlord',
                        required_score=31  # Basic verification required
                    )
                    
                    if not decision.granted:
                        raise drf_serializers.ValidationError({
                            'verification_required': True,
                            'message': 'Basic verification required to contact landlords about student housing',
                            'required_score': 31,
                            'current_score': decision.verification_score,
                            'reason': decision.blocking_reason
                        })
            except Listing.DoesNotExist:
                pass
        
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
        
        # Check verification if this is about a student housing listing
        if conversation.listing and conversation.listing.is_student_housing:
            if request.user.role == 'student':
                decision = access_control_engine.evaluate_access(
                    request.user,
                    'message_landlord',
                    required_score=31
                )
                
                if not decision.granted:
                    return Response({
                        'verification_required': True,
                        'message': 'Basic verification required to message about student housing',
                        'required_score': 31,
                        'current_score': decision.verification_score
                    }, status=status.HTTP_403_FORBIDDEN)

        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(conversation=conversation, sender=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
