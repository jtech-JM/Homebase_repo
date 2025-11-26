"""Enhanced community views with verification enforcement."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import timedelta

from .models import Post, Like, Comment
from .peer_verification_models import (
    PeerVerificationRequest,
    PeerVerificationStats,
    PeerVerificationLog
)
from .serializers import PostSerializer, CommentSerializer, LikeSerializer
from .access_control import community_access_controller
from verification.decorators import verification_required


class CommunityAccessMixin:
    """Mixin to add community access control to viewsets."""
    
    def check_community_access(self, action_type):
        """
        Check if user has access to perform community action.
        
        Args:
            action_type: 'create_post', 'comment', 'like', 'peer_verify'
            
        Returns:
            Tuple of (has_access, error_response)
        """
        user = self.request.user
        
        if action_type == 'create_post':
            can_access, reason = community_access_controller.can_create_post(user)
        elif action_type == 'comment':
            can_access, reason = community_access_controller.can_comment(user)
        elif action_type == 'like':
            can_access, reason = community_access_controller.can_like(user)
        elif action_type == 'peer_verify':
            can_access, reason = community_access_controller.can_participate_peer_verification(user)
        else:
            return False, Response({'error': 'Invalid action type'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not can_access:
            return False, Response({
                'error': 'Insufficient verification',
                'message': reason,
                'required_action': 'complete_verification'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return True, None
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def access_info(self, request):
        """Get user's community access information."""
        if not request.user.is_authenticated:
            return Response({
                'authenticated': False,
                'access_level': 'guest',
                'message': 'Login required for community participation'
            })
        
        access = community_access_controller.evaluate_community_access(request.user)
        requirements = community_access_controller.get_community_requirements()
        benefits = community_access_controller.get_verification_benefits(request.user)
        
        return Response({
            'authenticated': True,
            'access': {
                'can_view_posts': access.can_view_posts,
                'can_create_posts': access.can_create_posts,
                'can_comment': access.can_comment,
                'can_like': access.can_like,
                'can_participate_peer_verification': access.can_participate_peer_verification,
                'can_access_verified_only_content': access.can_access_verified_only_content,
                'access_level': access.access_level,
                'blocking_reason': access.blocking_reason,
            },
            'requirements': requirements,
            'benefits': benefits,
        })


class EnhancedPostViewSet(CommunityAccessMixin, viewsets.ModelViewSet):
    """Enhanced post viewset with verification enforcement."""
    
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Post.objects.select_related('author').prefetch_related('likes', 'comments')
        
        # Filter by category if provided
        category = self.request.query_params.get('category', None)
        if category and category != 'all':
            queryset = queryset.filter(category=category)
        
        # Filter verified-only content if user doesn't have access
        access = community_access_controller.evaluate_community_access(self.request.user)
        if not access.can_access_verified_only_content:
            # Exclude verified-only posts (if we add that field)
            pass
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create post with verification check."""
        has_access, error_response = self.check_community_access('create_post')
        if not has_access:
            return error_response
        
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Like post with verification check."""
        has_access, error_response = self.check_community_access('like')
        if not has_access:
            return error_response
        
        post = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        
        if not created:
            # Unlike if already liked
            like.delete()
            return Response({'status': 'unliked'}, status=status.HTTP_200_OK)
        
        return Response({'status': 'liked'}, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """Get or create comments with verification check."""
        post = self.get_object()
        
        if request.method == 'GET':
            comments = post.comments.all()
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            has_access, error_response = self.check_community_access('comment')
            if not has_access:
                return error_response
            
            serializer = CommentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(author=request.user, post=post)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PeerVerificationViewSet(viewsets.ModelViewSet):
    """ViewSet for peer verification system."""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Show verifications where user is either student or verifier
        return PeerVerificationRequest.objects.filter(
            models.Q(student=user) | models.Q(verifier=user)
        ).select_related('student', 'verifier')
    
    @action(detail=False, methods=['post'])
    def request_verification(self, request):
        """Request peer verification from another student."""
        # Check if user can participate in peer verification
        can_participate, reason = community_access_controller.can_participate_peer_verification(request.user)
        
        if not can_participate:
            return Response({
                'error': 'Insufficient verification',
                'message': reason,
                'required_action': 'complete_verification'
            }, status=status.HTTP_403_FORBIDDEN)
        
        student_id = request.data.get('student_id')
        verification_type = request.data.get('verification_type', 'general')
        relationship_description = request.data.get('relationship_description', '')
        
        if not student_id or not relationship_description:
            return Response({
                'error': 'student_id and relationship_description are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from users.models import User
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({
                'error': 'Student not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Can't verify yourself
        if student == request.user:
            return Response({
                'error': 'Cannot verify yourself'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create verification request
        verification_request, created = PeerVerificationRequest.objects.get_or_create(
            student=student,
            verifier=request.user,
            verification_type=verification_type,
            defaults={
                'relationship_description': relationship_description,
                'expires_at': timezone.now() + timedelta(days=30)
            }
        )
        
        if not created:
            return Response({
                'error': 'Verification request already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Log the action
        PeerVerificationLog.objects.create(
            verification_request=verification_request,
            action='request_created',
            actor=request.user,
            details=f'Verification requested as {verification_type}'
        )
        
        return Response({
            'success': True,
            'message': 'Peer verification request created',
            'verification_id': verification_request.id
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a peer verification request."""
        try:
            verification_request = PeerVerificationRequest.objects.get(
                id=pk,
                student=request.user,
                status='pending'
            )
        except PeerVerificationRequest.DoesNotExist:
            return Response({
                'error': 'Verification request not found or already processed'
            }, status=status.HTTP_404_NOT_FOUND)
        
        trust_score = request.data.get('trust_score', 5)
        verification_request.approve(trust_score=trust_score)
        
        # Log the action
        PeerVerificationLog.objects.create(
            verification_request=verification_request,
            action='request_approved',
            actor=request.user,
            details=f'Approved with trust score {trust_score}'
        )
        
        # Update stats
        stats, _ = PeerVerificationStats.objects.get_or_create(user=request.user)
        stats.update_stats()
        
        verifier_stats, _ = PeerVerificationStats.objects.get_or_create(user=verification_request.verifier)
        verifier_stats.update_stats()
        
        return Response({
            'success': True,
            'message': 'Peer verification approved'
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a peer verification request."""
        try:
            verification_request = PeerVerificationRequest.objects.get(
                id=pk,
                student=request.user,
                status='pending'
            )
        except PeerVerificationRequest.DoesNotExist:
            return Response({
                'error': 'Verification request not found or already processed'
            }, status=status.HTTP_404_NOT_FOUND)
        
        reason = request.data.get('reason', '')
        verification_request.reject(reason=reason)
        
        # Log the action
        PeerVerificationLog.objects.create(
            verification_request=verification_request,
            action='request_rejected',
            actor=request.user,
            details=reason
        )
        
        return Response({
            'success': True,
            'message': 'Peer verification rejected'
        })
    
    @action(detail=False, methods=['get'])
    def my_stats(self, request):
        """Get user's peer verification statistics."""
        stats, _ = PeerVerificationStats.objects.get_or_create(user=request.user)
        stats.update_stats()
        
        return Response({
            'verifications_received': stats.verifications_received,
            'verifications_given': stats.verifications_given,
            'average_trust_score': float(stats.average_trust_score),
            'reputation_score': stats.reputation_score,
            'last_updated': stats.last_updated,
        })
    
    @action(detail=False, methods=['get'])
    def pending_requests(self, request):
        """Get pending verification requests for the user."""
        pending = PeerVerificationRequest.objects.filter(
            student=request.user,
            status='pending'
        ).select_related('verifier')
        
        data = [{
            'id': req.id,
            'verifier': {
                'id': req.verifier.id,
                'email': req.verifier.email,
                'name': req.verifier.get_full_name() if hasattr(req.verifier, 'get_full_name') else req.verifier.email,
            },
            'verification_type': req.verification_type,
            'relationship_description': req.relationship_description,
            'created_at': req.created_at,
            'expires_at': req.expires_at,
        } for req in pending]
        
        return Response(data)
