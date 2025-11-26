"""Admin review workflow for manual verification"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from datetime import timedelta
from .enhanced_models import StudentVerification
from .admin_review_serializers import AdminReviewSerializer, AdminActionSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class AdminVerificationReviewViewSet(viewsets.ModelViewSet):
    """Admin viewset for reviewing and managing student verifications"""
    queryset = StudentVerification.objects.all()
    serializer_class = AdminReviewSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """Filter verifications based on query parameters"""
        queryset = StudentVerification.objects.select_related('user', 'assigned_agent').all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(overall_status=status_filter)
        
        # Filter by assigned agent
        agent_id = self.request.query_params.get('agent_id', None)
        if agent_id:
            queryset = queryset.filter(assigned_agent_id=agent_id)
        
        # Filter by review status
        review_status = self.request.query_params.get('review_status', None)
        if review_status:
            queryset = queryset.filter(agent_review_status=review_status)
        
        # Filter by document quality (low confidence)
        low_quality = self.request.query_params.get('low_quality', None)
        if low_quality == 'true':
            queryset = queryset.filter(
                document_analysis_results__confidence_score__lt=70
            )
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def assign_to_me(self, request, pk=None):
        """Assign verification to current admin"""
        verification = self.get_object()
        verification.assigned_agent = request.user
        verification.agent_review_status = 'in_progress'
        verification.save()
        
        return Response({
            'message': 'Verification assigned to you',
            'verification_id': str(verification.verification_id)
        })
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Manually approve verification"""
        verification = self.get_object()
        serializer = AdminActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Update verification
        verification.overall_status = 'approved'
        verification.agent_review_status = 'approved'
        verification.agent_notes = serializer.validated_data.get('notes', '')
        verification.agent_reviewed_at = timezone.now()
        verification.completed_at = timezone.now()
        verification.document_is_valid = True
        verification.verification_score = 100
        
        # Add manual review to verification methods
        if 'agent_manual_review' not in verification.verification_methods:
            verification.verification_methods.append('agent_manual_review')
        
        verification.save()
        
        # Update user profile
        user = verification.user
        if hasattr(user, 'student_profile'):
            profile = user.student_profile
            profile.is_verified = True
            profile.verification_status = 'approved'
            profile.save()
        
        return Response({
            'message': 'Verification approved successfully',
            'verification_id': str(verification.verification_id),
            'user_email': user.email
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject verification"""
        verification = self.get_object()
        serializer = AdminActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        verification.overall_status = 'rejected'
        verification.agent_review_status = 'rejected'
        verification.agent_notes = serializer.validated_data.get('notes', '')
        verification.agent_reviewed_at = timezone.now()
        verification.save()
        
        return Response({
            'message': 'Verification rejected',
            'verification_id': str(verification.verification_id)
        })
    
    @action(detail=True, methods=['post'])
    def request_reupload(self, request, pk=None):
        """Request user to re-upload clearer document"""
        verification = self.get_object()
        serializer = AdminActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        verification.overall_status = 'requires_additional_info'
        verification.agent_review_status = 'requires_additional_info'
        verification.agent_notes = serializer.validated_data.get('notes', 'Please upload a clearer image of your student ID')
        verification.agent_reviewed_at = timezone.now()
        verification.save()
        
        # TODO: Send notification to user
        
        return Response({
            'message': 'Re-upload request sent to user',
            'verification_id': str(verification.verification_id),
            'user_email': verification.user.email
        })
    
    @action(detail=False, methods=['get'])
    def pending_reviews(self, request):
        """Get all verifications pending review"""
        pending = self.get_queryset().filter(
            overall_status__in=['pending', 'in_progress']
        )
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def low_quality_documents(self, request):
        """Get verifications with low quality OCR results"""
        low_quality = self.get_queryset().filter(
            document_analysis_results__confidence_score__lt=70
        ).exclude(overall_status='approved')
        
        serializer = self.get_serializer(low_quality, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_assignments(self, request):
        """Get verifications assigned to current admin"""
        my_verifications = self.get_queryset().filter(
            assigned_agent=request.user
        ).exclude(agent_review_status='approved')
        
        serializer = self.get_serializer(my_verifications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add a note to verification"""
        verification = self.get_object()
        note = request.data.get('note', '')
        
        if note:
            current_notes = verification.agent_notes or ''
            timestamp = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
            new_note = f"\n[{timestamp}] {request.user.email}: {note}"
            verification.agent_notes = current_notes + new_note
            verification.save()
        
        return Response({
            'message': 'Note added successfully',
            'notes': verification.agent_notes
        })
