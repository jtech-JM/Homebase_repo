from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Profile
from .serializers import ProfileSerializer
from users.models import Student

class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    queryset = Profile.objects.all()

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)

    def get_object(self):
        return get_object_or_404(Profile, user=self.request.user)

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        # Pre-populate profile with registration and verification data for students
        if created and request.user.role == 'student':
            try:
                student = Student.objects.get(user=request.user)
                profile.major = student.university  # Store university in major field temporarily
                profile.graduation_year = student.student_id  # Store student_id in graduation_year field temporarily
                profile.save()
            except Student.DoesNotExist:
                pass
        
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            # Handle manual updates to university and student_id
            university = request.data.get('university')
            student_id = request.data.get('student_id')
            
            # Handle verification invalidation if profile data changes
            if request.user.role == 'student':
                from verification.enhanced_models import StudentVerification
                from django.utils import timezone
                from datetime import timedelta
                
                verification = StudentVerification.objects.filter(user=request.user).first()
                
                # Check if user is changing verified data
                if verification and verification.overall_status == 'approved' and verification.student_id_document:
                    # Get current student data
                    current_student = Student.objects.filter(user=request.user).first()
                    
                    # Check if critical fields are being changed
                    data_changed = False
                    changed_fields = []
                    
                    # Check university change
                    if (university and verification.university and 
                        verification.university not in ['', 'Unknown', 'Not specified'] and
                        university.upper() != verification.university.upper()):
                        data_changed = True
                        changed_fields.append('university')
                    
                    # Check student_id change
                    if (student_id and verification.student_id_number and 
                        verification.student_id_number not in ['', 'Unknown'] and
                        student_id != verification.student_id_number):
                        data_changed = True
                        changed_fields.append('student_id')
                    
                    if data_changed:
                        # Check if document was uploaded recently (within 24 hours)
                        # This prevents immediate changes after verification
                        if verification.updated_at and (timezone.now() - verification.updated_at) < timedelta(hours=24):
                            hours_remaining = int(24 - (timezone.now() - verification.updated_at).total_seconds() / 3600)
                            return Response({
                                'error': 'Unable to update verified information at this time',
                                'message': f'For your security, we don\'t allow changes to verified information within 24 hours of verification. Please wait {hours_remaining} more hour{"s" if hours_remaining != 1 else ""}, or contact our support team if you believe this is an error.',
                                'changed_fields': changed_fields,
                                'hours_remaining': int(24 - (timezone.now() - verification.updated_at).total_seconds() / 3600)
                            }, status=status.HTTP_400_BAD_REQUEST)
                        
                        # Invalidate the verification - user must re-verify
                        verification.overall_status = 'requires_additional_info'
                        verification.document_is_valid = False
                        verification.agent_notes = f"Profile data changed ({', '.join(changed_fields)}) on {timezone.now().strftime('%Y-%m-%d %H:%M')}. Re-verification required."
                        
                        # Remove student_id_upload from verification methods
                        if 'student_id_upload' in verification.verification_methods:
                            verification.verification_methods.remove('student_id_upload')
                        
                        # Recalculate score
                        verification.calculate_verification_score()
                        verification.save()
                        
                        # Return response indicating re-verification needed
                        return Response({
                            'success': True,
                            'verification_invalidated': True,
                            'changed_fields': changed_fields,
                            'message': f'Profile updated successfully. However, your verification has been invalidated because you changed your {", ".join(changed_fields)}. Please upload your student ID again to re-verify.',
                            'requires_reverification': True,
                            'verification_score': verification.verification_score,
                            'verification_url': '/verification'
                        }, status=status.HTTP_200_OK)
            
            # Update Student model if user is a student and data is provided
            if request.user.role == 'student' and (university or student_id):
                student, student_created = Student.objects.get_or_create(user=request.user)
                if university:
                    student.university = university
                if student_id:
                    student.student_id = student_id
                student.save()
            
            serializer = self.get_serializer(profile, data=request.data, partial=request.method == 'PATCH')
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
