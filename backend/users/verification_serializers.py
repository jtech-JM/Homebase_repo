"""Serializers that include verification status information."""

from rest_framework import serializers
from verification.access_control import access_control_engine


class VerificationStatusMixin:
    """Mixin to add verification status to serializers."""
    
    def get_verification_status(self, obj):
        """Get user's verification status."""
        if not hasattr(obj, 'id'):
            return None
        
        try:
            score = access_control_engine.get_user_verification_score(obj)
            level = access_control_engine.get_verification_level(score)
            permissions = access_control_engine.calculate_feature_permissions(obj)
            
            return {
                'score': score,
                'level': level,
                'badge': self._get_badge_info(score, level),
                'features': {
                    'can_book_student_housing': permissions.can_book_student_housing,
                    'can_access_student_discounts': permissions.can_access_student_discounts,
                    'can_access_community': permissions.can_access_community,
                    'can_access_priority_features': permissions.can_access_priority_features,
                }
            }
        except Exception as e:
            return {
                'score': 0,
                'level': 'unverified',
                'error': str(e)
            }
    
    def _get_badge_info(self, score, level):
        """Get badge display information."""
        if score >= 70:
            return {
                'icon': '✓',
                'label': 'Verified Student',
                'color': 'green',
            }
        elif score >= 31:
            return {
                'icon': '📧',
                'label': 'Basic Verified',
                'color': 'blue',
            }
        else:
            return {
                'icon': '○',
                'label': 'Unverified',
                'color': 'gray',
            }


class UserProfileWithVerificationSerializer(VerificationStatusMixin, serializers.Serializer):
    """User profile with verification status."""
    
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    role = serializers.CharField(read_only=True)
    verification_status = serializers.SerializerMethodField()
    
    def get_full_name(self, obj):
        """Get user's full name."""
        if hasattr(obj, 'get_full_name'):
            return obj.get_full_name()
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email


class StudentApplicationWithVerificationSerializer(VerificationStatusMixin, serializers.Serializer):
    """Student application with verification highlights."""
    
    id = serializers.IntegerField(read_only=True)
    student = UserProfileWithVerificationSerializer(read_only=True)
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    status = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    verification_highlights = serializers.SerializerMethodField()
    
    def get_verification_highlights(self, obj):
        """Get verification highlights for landlord view."""
        if not hasattr(obj, 'student'):
            return []
        
        score = access_control_engine.get_user_verification_score(obj.student)
        highlights = []
        
        if score >= 70:
            highlights.append({
                'type': 'success',
                'icon': '✓',
                'text': 'Fully Verified Student',
                'description': 'Student ID and university email verified'
            })
        elif score >= 31:
            highlights.append({
                'type': 'info',
                'icon': '📧',
                'text': 'University Email Verified',
                'description': 'Basic verification complete'
            })
        else:
            highlights.append({
                'type': 'warning',
                'icon': '⚠️',
                'text': 'Unverified',
                'description': 'Student has not completed verification'
            })
        
        # Add trust indicators
        if score >= 70:
            highlights.append({
                'type': 'badge',
                'icon': '🛡️',
                'text': 'Trusted Student',
                'description': 'Eligible for all features'
            })
        
        return highlights
