from django.contrib import admin
from .models import PlatformSettings, AdminActivityLog


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ['platform_fee', 'max_applications_per_student', 'email_notifications', 'updated_at']
    readonly_fields = ['updated_at', 'updated_by']
    
    def has_add_permission(self, request):
        # Only allow one instance
        return not PlatformSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion
        return False


@admin.register(AdminActivityLog)
class AdminActivityLogAdmin(admin.ModelAdmin):
    list_display = ['admin', 'action', 'target_model', 'target_id', 'created_at']
    list_filter = ['action', 'target_model', 'created_at']
    search_fields = ['admin__email', 'description']
    readonly_fields = ['admin', 'action', 'target_model', 'target_id', 'description', 'metadata', 'ip_address', 'created_at']
    
    def has_add_permission(self, request):
        # Logs are created automatically
        return False
    
    def has_change_permission(self, request, obj=None):
        # Logs should not be modified
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Allow deletion for cleanup
        return request.user.is_superuser
