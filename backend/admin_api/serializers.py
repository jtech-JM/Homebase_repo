from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from datetime import datetime, timedelta
from .models import PlatformSettings, AdminActivityLog
from support.models import SupportTicket, SupportMessage

User = get_user_model()


class UserManagementSerializer(serializers.ModelSerializer):
    """Serializer for user management in admin dashboard"""
    name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'is_active', 'date_joined', 'avatar', 'phone']
        read_only_fields = ['id', 'date_joined']
    
    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email.split('@')[0]
    
    def get_avatar(self, obj):
        # Check if user has a profile with avatar
        if hasattr(obj, 'profile') and obj.profile.avatar:
            # Return absolute URL for avatar
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile.avatar.url)
            return obj.profile.avatar.url
        # Return default avatar
        return '/default-avatar.svg'


class PropertyManagementSerializer(serializers.Serializer):
    """Serializer for property management"""
    id = serializers.IntegerField()
    title = serializers.CharField()
    address = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    images = serializers.ListField(child=serializers.CharField(), required=False)
    verified = serializers.BooleanField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    landlord = serializers.SerializerMethodField()
    
    def get_landlord(self, obj):
        if hasattr(obj, 'landlord'):
            return {
                'id': obj.landlord.id,
                'name': f"{obj.landlord.first_name} {obj.landlord.last_name}".strip() or obj.landlord.email.split('@')[0],
                'email': obj.landlord.email
            }
        return None


class ApplicationManagementSerializer(serializers.Serializer):
    """Serializer for application management"""
    id = serializers.IntegerField()
    status = serializers.CharField()
    message = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField()
    student = serializers.SerializerMethodField()
    listing = serializers.SerializerMethodField()
    
    def get_student(self, obj):
        if hasattr(obj, 'student'):
            student_profile = None
            if hasattr(obj.student, 'student'):
                student_profile = obj.student.student
            
            return {
                'id': obj.student.id,
                'name': f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.email.split('@')[0],
                'email': obj.student.email,
                'avatar': None,  # Add avatar logic if available
                'university': student_profile.university if student_profile else 'N/A'
            }
        return None
    
    def get_listing(self, obj):
        if hasattr(obj, 'listing'):
            return {
                'id': obj.listing.id,
                'title': obj.listing.title,
                'landlord': {
                    'id': obj.listing.landlord.id,
                    'name': f"{obj.listing.landlord.first_name} {obj.listing.landlord.last_name}".strip() or obj.listing.landlord.email.split('@')[0]
                }
            }
        return None


class PaymentManagementSerializer(serializers.Serializer):
    """Serializer for payment management"""
    id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    payment_type = serializers.CharField()
    created_at = serializers.DateTimeField()
    student = serializers.SerializerMethodField()
    listing = serializers.SerializerMethodField()
    
    def get_student(self, obj):
        if hasattr(obj, 'student'):
            return {
                'id': obj.student.id,
                'name': f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.email.split('@')[0]
            }
        return None
    
    def get_listing(self, obj):
        if hasattr(obj, 'listing'):
            return {
                'id': obj.listing.id,
                'title': obj.listing.title,
                'landlord': {
                    'id': obj.listing.landlord.id,
                    'name': f"{obj.listing.landlord.first_name} {obj.listing.landlord.last_name}".strip() or obj.listing.landlord.email.split('@')[0]
                }
            }
        return None


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    totalStudents = serializers.IntegerField()
    totalLandlords = serializers.IntegerField()
    activeListings = serializers.IntegerField()
    pendingApplications = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class DashboardAlertSerializer(serializers.Serializer):
    """Serializer for dashboard alerts"""
    title = serializers.CharField()
    description = serializers.CharField()
    time = serializers.CharField()
    severity = serializers.CharField(default='warning')


class PlatformSettingsSerializer(serializers.ModelSerializer):
    """Serializer for platform settings"""
    platformFee = serializers.DecimalField(source='platform_fee', max_digits=5, decimal_places=2)
    maxApplicationsPerStudent = serializers.IntegerField(source='max_applications_per_student')
    maintenanceResponseTime = serializers.IntegerField(source='maintenance_response_time')
    emailNotifications = serializers.BooleanField(source='email_notifications')
    smsNotifications = serializers.BooleanField(source='sms_notifications')
    autoApproval = serializers.BooleanField(source='auto_approval')
    verificationRequired = serializers.BooleanField(source='verification_required')
    
    class Meta:
        model = PlatformSettings
        fields = [
            'platformFee', 'maxApplicationsPerStudent', 'maintenanceResponseTime',
            'emailNotifications', 'smsNotifications', 'autoApproval', 'verificationRequired'
        ]


class TicketMessageSerializer(serializers.ModelSerializer):
    """Serializer for ticket messages"""
    
    class Meta:
        model = SupportMessage
        fields = ['id', 'content', 'sender', 'created_at']
        read_only_fields = ['id', 'created_at']


class SupportTicketSerializer(serializers.ModelSerializer):
    """Serializer for support tickets"""
    user = serializers.SerializerMethodField()
    messages = TicketMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = ['id', 'title', 'description', 'status', 'priority', 'user', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'name': f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email.split('@')[0],
            'email': obj.user.email
        }


class SupportTicketListSerializer(serializers.ModelSerializer):
    """Simplified serializer for ticket list"""
    user = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportTicket
        fields = ['id', 'title', 'status', 'priority', 'user', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'name': f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email.split('@')[0],
            'email': obj.user.email
        }


class ReportStatsSerializer(serializers.Serializer):
    """Serializer for report statistics"""
    userStats = serializers.DictField()
    propertyStats = serializers.DictField()
    revenueStats = serializers.DictField()
    applicationStats = serializers.DictField()


class AdminActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for admin activity logs"""
    admin_email = serializers.EmailField(source='admin.email', read_only=True)
    admin_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminActivityLog
        fields = ['id', 'admin_email', 'admin_name', 'action', 'target_model', 'target_id', 'description', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_admin_name(self, obj):
        return f"{obj.admin.first_name} {obj.admin.last_name}".strip() or obj.admin.email.split('@')[0]
