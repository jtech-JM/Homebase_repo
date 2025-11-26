"""Serializers for admin review workflow"""
from rest_framework import serializers
from .enhanced_models import StudentVerification
from django.contrib.auth import get_user_model

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for admin review"""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']


class AdminReviewSerializer(serializers.ModelSerializer):
    """Serializer for admin verification review"""
    user = UserBasicSerializer(read_only=True)
    assigned_agent = UserBasicSerializer(read_only=True)
    document_url = serializers.SerializerMethodField()
    ocr_confidence = serializers.SerializerMethodField()
    extracted_student_id = serializers.SerializerMethodField()
    extracted_university = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentVerification
        fields = [
            'id',
            'verification_id',
            'user',
            'university',
            'student_id_number',
            'expected_graduation_year',
            'major',
            'overall_status',
            'agent_review_status',
            'verification_methods',
            'verification_score',
            'document_url',
            'ocr_extracted_text',
            'ocr_confidence',
            'extracted_student_id',
            'extracted_university',
            'document_is_valid',
            'university_logo_detected',
            'assigned_agent',
            'agent_notes',
            'agent_reviewed_at',
            'created_at',
            'updated_at',
            'completed_at',
        ]
        read_only_fields = ['verification_id', 'created_at', 'updated_at']
    
    def get_document_url(self, obj):
        """Get document URL"""
        if obj.student_id_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.student_id_document.url)
            return obj.student_id_document.url
        return None
    
    def get_ocr_confidence(self, obj):
        """Get OCR confidence score"""
        if obj.document_analysis_results:
            return obj.document_analysis_results.get('confidence_score', 0)
        return 0
    
    def get_extracted_student_id(self, obj):
        """Get extracted student ID from OCR"""
        if obj.document_analysis_results:
            extracted = obj.document_analysis_results.get('extracted_data', {})
            return extracted.get('student_id')
        return None
    
    def get_extracted_university(self, obj):
        """Get extracted university from OCR"""
        if obj.document_analysis_results:
            extracted = obj.document_analysis_results.get('extracted_data', {})
            return extracted.get('university')
        return None


class AdminActionSerializer(serializers.Serializer):
    """Serializer for admin actions (approve, reject, request reupload)"""
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_notes(self, value):
        """Ensure notes are provided for reject and reupload actions"""
        action = self.context.get('action')
        if action in ['reject', 'request_reupload'] and not value:
            raise serializers.ValidationError(
                f"Notes are required when {action.replace('_', ' ')}ing a verification"
            )
        return value
