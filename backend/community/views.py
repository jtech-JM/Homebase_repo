from rest_framework import viewsets, status, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Post, Like, Comment
from .serializers import PostSerializer, CommentSerializer, LikeSerializer
from verification.access_control import access_control_engine


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Post.objects.select_related('author').prefetch_related('likes', 'comments')
        
        # Filter by category if provided
        category = self.request.query_params.get('category', None)
        if category and category != 'all':
            queryset = queryset.filter(category=category)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Check verification before allowing community access."""
        decision = access_control_engine.evaluate_access(
            request.user,
            'community_access',
            required_score=31  # Basic verification required
        )
        
        if not decision.granted:
            return Response({
                'verification_required': True,
                'message': 'Community access requires basic verification (31%+)',
                'required_score': 31,
                'current_score': decision.verification_score,
                'reason': decision.blocking_reason,
                'verification_url': '/verification'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().list(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Check verification before allowing post creation."""
        decision = access_control_engine.evaluate_access(
            self.request.user,
            'community_post',
            required_score=31  # Basic verification required
        )
        
        if not decision.granted:
            raise drf_serializers.ValidationError({
                'verification_required': True,
                'message': 'Creating posts requires basic verification (31%+)',
                'required_score': 31,
                'current_score': decision.verification_score,
                'reason': decision.blocking_reason
            })
        
        serializer.save(author=self.request.user)
    
    def perform_update(self, serializer):
        # Only allow author to update
        if serializer.instance.author != self.request.user:
            return Response(
                {'error': 'You can only edit your own posts'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only allow author to delete
        if instance.author != self.request.user:
            return Response(
                {'error': 'You can only delete your own posts'},
                status=status.HTTP_403_FORBIDDEN
            )
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Check verification before allowing likes."""
        decision = access_control_engine.evaluate_access(
            request.user,
            'community_interaction',
            required_score=31
        )
        
        if not decision.granted:
            return Response({
                'verification_required': True,
                'message': 'Liking posts requires basic verification (31%+)',
                'required_score': 31,
                'current_score': decision.verification_score
            }, status=status.HTTP_403_FORBIDDEN)
        
        post = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        
        if not created:
            # Unlike if already liked
            like.delete()
            return Response({'status': 'unliked'}, status=status.HTTP_200_OK)
        
        return Response({'status': 'liked'}, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        post = self.get_object()
        
        if request.method == 'GET':
            comments = post.comments.all()
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Check verification before allowing comments
            decision = access_control_engine.evaluate_access(
                request.user,
                'community_comment',
                required_score=31
            )
            
            if not decision.granted:
                return Response({
                    'verification_required': True,
                    'message': 'Commenting requires basic verification (31%+)',
                    'required_score': 31,
                    'current_score': decision.verification_score
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = CommentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(author=request.user, post=post)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Comment.objects.select_related('author', 'post').all()
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    def perform_update(self, serializer):
        if serializer.instance.author != self.request.user:
            return Response(
                {'error': 'You can only edit your own comments'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()
    
    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            return Response(
                {'error': 'You can only delete your own comments'},
                status=status.HTTP_403_FORBIDDEN
            )
        instance.delete()
