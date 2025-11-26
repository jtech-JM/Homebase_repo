from django.contrib import admin
from .models import (
    Post, Like, Comment,
    PeerVerificationRequest, PeerVerificationStats, PeerVerificationLog
)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'author', 'category', 'content_preview', 'likes_count', 'comments_count', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['content', 'author__email', 'author__first_name', 'author__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'post__content']
    readonly_fields = ['created_at']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'author', 'post', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'author__email', 'post__content']
    readonly_fields = ['created_at', 'updated_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


# Peer Verification Admin

@admin.register(PeerVerificationRequest)
class PeerVerificationRequestAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'student', 'verifier', 'verification_type', 
        'status', 'trust_score', 'created_at'
    ]
    list_filter = ['status', 'verification_type', 'created_at', 'reviewed_by_admin']
    search_fields = ['student__email', 'verifier__email', 'relationship_description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PeerVerificationStats)
class PeerVerificationStatsAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'verifications_received', 'verifications_given',
        'average_trust_score', 'reputation_score', 'last_updated'
    ]
    search_fields = ['user__email']
    readonly_fields = ['last_updated']
    actions = ['recalculate_stats']
    
    def recalculate_stats(self, request, queryset):
        for stats in queryset:
            stats.update_stats()
        self.message_user(request, f'Recalculated stats for {queryset.count()} users')
    recalculate_stats.short_description = 'Recalculate statistics'


@admin.register(PeerVerificationLog)
class PeerVerificationLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'verification_request', 'action', 'actor', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['verification_request__student__email', 'actor__email']
    readonly_fields = ['timestamp']
