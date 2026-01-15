from rest_framework import serializers
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    # Include user fields for convenience
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    # Include student fields if available
    university = serializers.SerializerMethodField()
    student_id = serializers.SerializerMethodField()

    # Include landlord fields if available
    national_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = [
            'id',
            'bio',
            'avatar',
            'phone',
            'verified',
            'date_of_birth',
            'address',
            'major',
            'graduation_year',
            # User fields (read-only)
            'first_name',
            'last_name',
            'email',
            # Student fields (read-only)
            'university',
            'student_id',
            # Landlord fields (read-only)
            'national_id'
        ]
        read_only_fields = ['verified', 'first_name', 'last_name', 'email', 'university', 'student_id', 'national_id']
    
    def to_representation(self, instance):
        """Customize the output representation"""
        data = super().to_representation(instance)
        # If profile phone is empty, use user phone as fallback
        if not data.get('phone'):
            data['phone'] = instance.user.phone or ''
        return data
    
    def get_university(self, obj):
        """Get university from Student model if user is a student"""
        if obj.user.role == 'student':
            try:
                from users.models import Student
                student = Student.objects.get(user=obj.user)
                return student.university
            except Student.DoesNotExist:
                pass
        return obj.major  # Fallback to major field
    
    def get_student_id(self, obj):
        """Get student_id from Student model if user is a student"""
        if obj.user.role == 'student':
            try:
                from users.models import Student
                student = Student.objects.get(user=obj.user)
                return student.student_id
            except Student.DoesNotExist:
                pass
        return str(obj.graduation_year) if obj.graduation_year else ''  # Fallback to graduation_year field

    def get_national_id(self, obj):
        """Get national_id from Landlord model if user is a landlord"""
        if obj.user.role == 'landlord':
            try:
                from users.models import Landlord
                landlord = Landlord.objects.get(user=obj.user)
                return landlord.national_id
            except Landlord.DoesNotExist:
                pass
        return ''
