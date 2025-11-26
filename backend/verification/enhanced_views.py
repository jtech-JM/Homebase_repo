from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.conf import settings
import json
import logging

from .enhanced_models import StudentVerification, VerificationStep, PeerVerification, VerificationDocument
from .verification_services import VerificationOrchestrator, DocumentAnalysisService
from users.permissions import IsStudent, IsAgent

User = get_user_model()
logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStudent])
def verification_status(request):
    """Get current verification status for the student"""
    try:
        verification = StudentVerification.objects.filter(user=request.user).first()
        
        if not verification:
            return Response({
                'status': None,
                'score': 0,
                'completedSteps': 0,
                'requiredSteps': [],
                'optionalSteps': []
            })
        
        return Response({
            'status': verification.overall_status,
            'score': verification.verification_score,
            'completedSteps': len(verification.verification_methods),
            'requiredSteps': verification.get_required_steps(),
            'optionalSteps': verification.get_optional_steps(),
            'verificationId': str(verification.verification_id),
            'createdAt': verification.created_at.isoformat(),
            'updatedAt': verification.updated_at.isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error getting verification status: {e}")
        return Response(
            {'error': 'Failed to get verification status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStudent])
def initiate_verification(request):
    """Start the verification process for a student"""
    try:
        # Check if verification already exists
        existing_verification = StudentVerification.objects.filter(user=request.user).first()
        if existing_verification and existing_verification.overall_status == 'approved':
            return Response(
                {'error': 'Student is already verified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        verification_data = {
            'university': request.data.get('university', ''),
            'student_id_number': request.data.get('studentId', ''),
            'graduation_year': request.data.get('graduationYear'),
            'major': request.data.get('major', ''),
            'university_email': request.data.get('universityEmail', ''),
            'phone_number': request.data.get('phoneNumber', ''),
        }
        
        # Validate against existing profile data
        validation_result = _validate_verification_against_profile(request.user, verification_data)
        if not validation_result['valid']:
            return Response(
                {
                    'error': 'Verification data does not match profile data',
                    'details': validation_result['errors'],
                    'conflicts': validation_result['conflicts']
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update verification
        if existing_verification:
            for key, value in verification_data.items():
                if value:  # Only update non-empty values
                    setattr(existing_verification, key, value)
            existing_verification.save()
            verification = existing_verification
        else:
            verification = VerificationOrchestrator.initiate_verification(
                request.user, 
                verification_data
            )
        
        # Sync verification data to profile
        _sync_verification_to_profile(verification)
        
        return Response({
            'verificationId': str(verification.verification_id),
            'status': verification.overall_status,
            'message': 'Verification initiated successfully'
        })
    
    except Exception as e:
        logger.error(f"Error initiating verification: {e}")
        return Response(
            {'error': 'Failed to initiate verification'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStudent])
def submit_verification_step(request):
    """Submit a specific verification step"""
    try:
        verification = get_object_or_404(
            StudentVerification, 
            user=request.user
        )
        
        step_type = request.data.get('stepType')
        step_data = request.data.get('stepData', {})
        
        if not step_type:
            return Response(
                {'error': 'Step type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = VerificationOrchestrator.process_verification_step(
            verification, 
            step_type, 
            step_data
        )
        
        if success:
            verification.refresh_from_db()
            return Response({
                'success': True,
                'verificationScore': verification.verification_score,
                'overallStatus': verification.overall_status,
                'message': f'{step_type} completed successfully'
            })
        else:
            return Response(
                {'error': f'Failed to process {step_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except StudentVerification.DoesNotExist:
        return Response(
            {'error': 'Verification not found. Please initiate verification first.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error submitting verification step: {e}")
        return Response(
            {'error': 'Failed to submit verification step'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStudent])
def upload_document(request):
    """Upload verification document"""
    try:
        verification = get_object_or_404(
            StudentVerification, 
            user=request.user
        )
        
        document_file = request.FILES.get('document')
        document_type = request.data.get('document_type', 'student_id')
        
        if not document_file:
            return Response(
                {
                    'error': 'No document provided',
                    'message': 'Please select a document to upload. We accept student ID cards, enrollment letters, or other verification documents.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (5MB limit)
        if document_file.size > 5 * 1024 * 1024:
            file_size_mb = round(document_file.size / (1024 * 1024), 2)
            return Response(
                {
                    'error': 'File size too large',
                    'message': f'Your file is {file_size_mb}MB, but we only accept files up to 5MB. Please try compressing your image or using a different file.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        if document_file.content_type not in allowed_types:
            return Response(
                {
                    'error': 'Invalid file type',
                    'message': f'We only accept JPEG, PNG, and PDF files. Your file appears to be {document_file.content_type}. Please convert your document and try again.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save the main document
        if document_type == 'student_id':
            verification.student_id_document = document_file
            verification.save()
            
            # Analyze the document
            try:
                analysis_results = DocumentAnalysisService.analyze_document(
                    verification.student_id_document.path,
                    verification.university
                )
                
                # Validate document data against profile
                validation_result = _validate_document_against_profile(
                    request.user, 
                    verification, 
                    analysis_results
                )
                
                if not validation_result['valid']:
                    # Document doesn't match profile - reject
                    verification.document_is_valid = False
                    verification.ocr_extracted_text = analysis_results['ocr_text']
                    verification.document_analysis_results = analysis_results
                    verification.save()
                    
                    # Create user-friendly error message
                    conflict_summary = []
                    for conflict in validation_result['conflicts']:
                        field_name = conflict['field'].replace('_', ' ').title()
                        conflict_summary.append(f"{field_name}: Expected '{conflict['expected']}', but found '{conflict.get('found_in_document', 'not detected')}' in document")
                    
                    return Response({
                        'success': False,
                        'error': 'Document verification failed',
                        'details': validation_result['errors'],
                        'conflicts': validation_result['conflicts'],
                        'analysisResults': analysis_results,
                        'message': 'We couldn\'t verify your document because the information doesn\'t match your profile. ' + 
                                   'Please make sure your profile information is correct, or upload a different document. ' +
                                   'If you need help, please contact our support team.',
                        'conflict_summary': conflict_summary
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                verification.ocr_extracted_text = analysis_results['ocr_text']
                verification.document_analysis_results = analysis_results
                verification.university_logo_detected = analysis_results['logo_detected']
                verification.document_expiry_date = analysis_results['expiry_date']
                verification.document_is_valid = analysis_results['is_valid']
                
                # IMPORTANT: Populate verification fields with extracted data
                extracted_data = analysis_results.get('extracted_data', {})
                
                # Update university if extracted and not already set
                if extracted_data.get('university') and verification.university in ['', 'Unknown', 'Not specified']:
                    verification.university = extracted_data['university']
                
                # Update student_id if extracted and not already set
                if extracted_data.get('student_id') and not verification.student_id_number:
                    verification.student_id_number = extracted_data['student_id']
                
                # Update major if extracted and not already set
                if extracted_data.get('major') and not verification.major:
                    verification.major = extracted_data['major']
                elif extracted_data.get('program') and not verification.major:
                    # Use program if major not found
                    verification.major = extracted_data['program']
                
                verification.save()
                
                # Update verification methods
                if 'student_id_upload' not in verification.verification_methods:
                    verification.verification_methods.append('student_id_upload')
                    verification.save()
                
                # Update verification score
                verification.calculate_verification_score()
                verification.save()
                
                # Sync verification data to Profile and Student models
                _sync_verification_to_profile(verification)
                
                return Response({
                    'success': True,
                    'analysisResults': analysis_results,
                    'verificationScore': verification.verification_score,
                    'message': 'Document uploaded and analyzed successfully'
                })
                
            except Exception as analysis_error:
                logger.error(f"Document analysis failed: {analysis_error}")
                return Response({
                    'success': True,
                    'message': 'Document uploaded successfully, but analysis failed',
                    'analysisResults': None
                })
        
        else:
            # Save as additional document
            VerificationDocument.objects.create(
                verification=verification,
                document_type=document_type,
                document_file=document_file
            )
            
            return Response({
                'success': True,
                'message': 'Additional document uploaded successfully'
            })
    
    except StudentVerification.DoesNotExist:
        return Response(
            {'error': 'Verification not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error uploading document: {e}", exc_info=True)
        return Response(
            {
                'error': 'Upload failed',
                'message': 'We encountered an unexpected error while processing your document. Please try again in a moment. If the problem persists, please contact our support team.',
                'support_email': 'support@homebase.com'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStudent])
def verify_email(request):
    """Verify university email address"""
    try:
        verification = get_object_or_404(
            StudentVerification, 
            user=request.user
        )
        
        email = request.data.get('email')
        verification_code = request.data.get('verificationCode')
        
        if verification_code:
            # Verify the code (mock implementation)
            # In production, check against stored code and expiry
            verification.university_email = email
            verification.university_email_verified = True
            
            # Check if it's a valid university domain
            from .verification_services import UniversityEmailVerificationService
            verification.university_domain_valid = UniversityEmailVerificationService.is_valid_university_domain(email)
            
            # Update verification methods
            if 'university_email' not in verification.verification_methods:
                verification.verification_methods.append('university_email')
            
            verification.calculate_verification_score()
            verification.save()
            
            # Sync to profile
            _sync_verification_to_profile(verification)
            
            return Response({
                'success': True,
                'verified': True,
                'verificationScore': verification.verification_score,
                'message': 'Email verified successfully'
            })
        
        else:
            # Send verification code
            from .verification_services import UniversityEmailVerificationService
            code = UniversityEmailVerificationService.send_verification_email(request.user, email)
            
            if code:
                # Store code temporarily (in production, use cache or database)
                return Response({
                    'success': True,
                    'codeSent': True,
                    'message': 'Verification code sent to your email'
                })
            else:
                return Response(
                    {'error': 'Failed to send verification email'},
                    status=status.HTTP_400_BAD_REQUEST
                )
    
    except StudentVerification.DoesNotExist:
        return Response(
            {'error': 'Verification not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error verifying email: {e}")
        return Response(
            {'error': 'Failed to verify email'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStudent])
def verify_phone(request):
    """Verify phone number via SMS"""
    try:
        verification = get_object_or_404(
            StudentVerification, 
            user=request.user
        )
        
        phone = request.data.get('phoneNumber')
        verification_code = request.data.get('verificationCode')
        
        if verification_code:
            # Verify the code (mock implementation)
            verification.phone_number = phone
            verification.phone_verified = True
            
            # Update verification methods
            if 'phone_verification' not in verification.verification_methods:
                verification.verification_methods.append('phone_verification')
            
            verification.calculate_verification_score()
            verification.save()
            
            # Sync to profile
            _sync_verification_to_profile(verification)
            
            return Response({
                'success': True,
                'verified': True,
                'verificationScore': verification.verification_score,
                'message': 'Phone number verified successfully'
            })
        
        else:
            # Send SMS code
            from .verification_services import PhoneVerificationService
            code = PhoneVerificationService.generate_verification_code()
            success = PhoneVerificationService.send_sms_verification(phone, code)
            
            if success:
                # Store code temporarily
                verification.phone_verification_code = code
                verification.phone_verification_expires = timezone.now() + timezone.timedelta(minutes=15)
                verification.save()
                
                return Response({
                    'success': True,
                    'codeSent': True,
                    'message': 'SMS verification code sent'
                })
            else:
                return Response(
                    {'error': 'Failed to send SMS code'},
                    status=status.HTTP_400_BAD_REQUEST
                )
    
    except StudentVerification.DoesNotExist:
        return Response(
            {'error': 'Verification not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error verifying phone: {e}")
        return Response(
            {'error': 'Failed to verify phone'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStudent])
def submit_peer_verification(request):
    """Submit peer verification request"""
    try:
        target_user_id = request.data.get('targetUserId')
        relationship = request.data.get('relationship', '')
        knows_personally = request.data.get('knowsPersonally', False)
        same_university = request.data.get('sameUniversity', False)
        confidence_level = request.data.get('confidenceLevel', 2)
        notes = request.data.get('notes', '')
        
        target_user = get_object_or_404(User, id=target_user_id)
        target_verification = get_object_or_404(
            StudentVerification, 
            user=target_user
        )
        
        # Check if peer verification already exists
        existing_peer = PeerVerification.objects.filter(
            verification=target_verification,
            verifying_student=request.user
        ).first()
        
        if existing_peer:
            return Response(
                {'error': 'You have already provided verification for this student'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create peer verification
        peer_verification = PeerVerification.objects.create(
            verification=target_verification,
            verifying_student=request.user,
            knows_personally=knows_personally,
            same_university=same_university,
            confidence_level=confidence_level,
            relationship=relationship,
            additional_notes=notes,
            is_approved=True  # Auto-approve for now
        )
        
        # Update target verification
        target_verification.peer_verification_count += 1
        target_verification.calculate_verification_score()
        target_verification.save()
        
        return Response({
            'success': True,
            'message': 'Peer verification submitted successfully'
        })
    
    except User.DoesNotExist:
        return Response(
            {'error': 'Target user not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except StudentVerification.DoesNotExist:
        return Response(
            {'error': 'Target verification not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error submitting peer verification: {e}")
        return Response(
            {'error': 'Failed to submit peer verification'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAgent])
def agent_verification_queue(request):
    """Get verification queue for agent review"""
    try:
        # Get verifications that need agent review
        verifications = StudentVerification.objects.filter(
            overall_status__in=['pending', 'in_progress'],
            verification_score__gte=50  # Only show verifications with reasonable score
        ).select_related('user').order_by('-created_at')
        
        verification_data = []
        for verification in verifications:
            verification_data.append({
                'id': verification.id,
                'verificationId': str(verification.verification_id),
                'student': {
                    'id': verification.user.id,
                    'name': f"{verification.user.first_name} {verification.user.last_name}".strip() or verification.user.email.split('@')[0],
                    'email': verification.user.email
                },
                'university': verification.university,
                'studentId': verification.student_id_number,
                'verificationScore': verification.verification_score,
                'status': verification.overall_status,
                'completedMethods': verification.verification_methods,
                'documentsUploaded': bool(verification.student_id_document),
                'emailVerified': verification.university_email_verified,
                'phoneVerified': verification.phone_verified,
                'peerVerifications': verification.peer_verification_count,
                'submittedAt': verification.created_at.isoformat(),
                'updatedAt': verification.updated_at.isoformat()
            })
        
        return Response({
            'verifications': verification_data,
            'total': len(verification_data)
        })
    
    except Exception as e:
        logger.error(f"Error getting agent verification queue: {e}")
        return Response(
            {'error': 'Failed to get verification queue'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAgent])
def agent_review_verification(request, verification_id):
    """Agent review and approve/reject verification"""
    try:
        verification = get_object_or_404(
            StudentVerification, 
            id=verification_id
        )
        
        action = request.data.get('action')  # 'approve' or 'reject'
        notes = request.data.get('notes', '')
        
        if action not in ['approve', 'reject']:
            return Response(
                {'error': 'Invalid action. Must be "approve" or "reject"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update verification
        verification.assigned_agent = request.user
        verification.agent_review_status = 'approved' if action == 'approve' else 'rejected'
        verification.agent_notes = notes
        verification.agent_reviewed_at = timezone.now()
        
        if action == 'approve':
            verification.overall_status = 'approved'
            verification.completed_at = timezone.now()
        else:
            verification.overall_status = 'rejected'
        
        # Update verification methods
        if 'agent_manual_review' not in verification.verification_methods:
            verification.verification_methods.append('agent_manual_review')
        
        verification.calculate_verification_score()
        verification.save()
        
        return Response({
            'success': True,
            'action': action,
            'verificationScore': verification.verification_score,
            'status': verification.overall_status,
            'message': f'Verification {action}ed successfully'
        })
    
    except StudentVerification.DoesNotExist:
        return Response(
            {'error': 'Verification not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error reviewing verification: {e}")
        return Response(
            {'error': 'Failed to review verification'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verification_statistics(request):
    """Get verification statistics"""
    try:
        stats = {
            'total_verifications': StudentVerification.objects.count(),
            'approved': StudentVerification.objects.filter(overall_status='approved').count(),
            'pending': StudentVerification.objects.filter(overall_status='pending').count(),
            'in_progress': StudentVerification.objects.filter(overall_status='in_progress').count(),
            'rejected': StudentVerification.objects.filter(overall_status='rejected').count(),
            'average_score': StudentVerification.objects.aggregate(
                avg_score=models.Avg('verification_score')
            )['avg_score'] or 0
        }
        
        return Response(stats)
    
    except Exception as e:
        logger.error(f"Error getting verification statistics: {e}")
        return Response(
            {'error': 'Failed to get statistics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _sync_verification_to_profile(verification):
    """
    Sync verification data to Profile and Student models.
    Syncs from both verification fields and extracted document data.
    Only syncs if fields are empty to avoid overwriting manual entries.
    """
    try:
        from profiles.models import Profile
        from users.models import Student
        
        # Update or create Profile
        profile, created = Profile.objects.get_or_create(user=verification.user)
        
        # Get extracted data from document analysis if available
        extracted_data = {}
        if verification.document_analysis_results:
            extracted_data = verification.document_analysis_results.get('extracted_data', {})
        
        # Sync major (from verification field or extracted data)
        major_to_sync = verification.major or extracted_data.get('major') or extracted_data.get('program')
        if major_to_sync and not profile.major:
            profile.major = major_to_sync
            logger.info(f"Synced major to profile: {major_to_sync}")
        
        # Sync graduation year
        if verification.expected_graduation_year and not profile.graduation_year:
            profile.graduation_year = verification.expected_graduation_year
        
        # Sync phone number
        if verification.phone_number and not profile.phone:
            profile.phone = verification.phone_number
        
        profile.save()
        
        # Update or create Student record if user is a student
        if verification.user.role == 'student':
            student, created = Student.objects.get_or_create(user=verification.user)
            
            # Sync university (from verification field or extracted data)
            university_to_sync = verification.university or extracted_data.get('university')
            if (university_to_sync and 
                university_to_sync not in ['', 'Unknown', 'Not specified'] and
                (not student.university or student.university in ['Not specified', 'Unknown', ''])):
                student.university = university_to_sync
                logger.info(f"Synced university to student: {university_to_sync}")
            
            # Sync student_id (from verification field or extracted data)
            student_id_to_sync = verification.student_id_number or extracted_data.get('student_id')
            if (student_id_to_sync and 
                student_id_to_sync not in ['', 'Unknown'] and
                (not student.student_id or student.student_id == '')):
                student.student_id = student_id_to_sync
                logger.info(f"Synced student_id to student: {student_id_to_sync}")
            
            student.save()
            
            logger.info(f"Successfully synced verification data to profile and student for user {verification.user.id}")
    
    except Exception as e:
        logger.error(f"Failed to sync verification to profile: {e}", exc_info=True)


def _validate_verification_against_profile(user, verification_data):
    """
    Validate verification data against existing profile data.
    Returns dict with 'valid' boolean and 'errors' list.
    """
    from profiles.models import Profile
    from users.models import Student
    
    result = {
        'valid': True,
        'errors': [],
        'conflicts': []
    }
    
    try:
        # Get profile and student data
        profile = Profile.objects.filter(user=user).first()
        student = Student.objects.filter(user=user).first()
        
        if not profile and not student:
            # No existing data to validate against
            return result
        
        # Validate university (only if both have actual values)
        if (student and student.university and 
            student.university not in ['Not specified', 'Unknown', '']):
            verification_university = verification_data.get('university', '').strip()
            if (verification_university and 
                verification_university not in ['Unknown', ''] and
                verification_university.lower() != student.university.lower()):
                result['valid'] = False
                result['errors'].append(
                    f"University mismatch: Profile has '{student.university}', verification has '{verification_university}'"
                )
                result['conflicts'].append({
                    'field': 'university',
                    'profile_value': student.university,
                    'verification_value': verification_university
                })
        
        # Validate student ID (only if both have actual values)
        if (student and student.student_id and 
            student.student_id not in ['Unknown', '']):
            verification_student_id = verification_data.get('student_id_number', '').strip()
            if (verification_student_id and 
                verification_student_id not in ['Unknown', ''] and
                verification_student_id != student.student_id):
                result['valid'] = False
                result['errors'].append(
                    f"Student ID mismatch: Profile has '{student.student_id}', verification has '{verification_student_id}'"
                )
                result['conflicts'].append({
                    'field': 'student_id',
                    'profile_value': student.student_id,
                    'verification_value': verification_student_id
                })
        
        # Validate major
        if profile and profile.major:
            verification_major = verification_data.get('major', '').strip()
            if verification_major and verification_major.lower() != profile.major.lower():
                result['valid'] = False
                result['errors'].append(
                    f"Major mismatch: Profile has '{profile.major}', verification has '{verification_major}'"
                )
                result['conflicts'].append({
                    'field': 'major',
                    'profile_value': profile.major,
                    'verification_value': verification_major
                })
        
        # Validate graduation year
        if profile and profile.graduation_year:
            verification_grad_year = verification_data.get('graduation_year')
            if verification_grad_year and int(verification_grad_year) != int(profile.graduation_year):
                result['valid'] = False
                result['errors'].append(
                    f"Graduation year mismatch: Profile has '{profile.graduation_year}', verification has '{verification_grad_year}'"
                )
                result['conflicts'].append({
                    'field': 'graduation_year',
                    'profile_value': profile.graduation_year,
                    'verification_value': verification_grad_year
                })
        
    except Exception as e:
        logger.error(f"Error validating verification against profile: {e}")
        # On error, allow verification to proceed
        result['valid'] = True
    
    return result


def _validate_document_against_profile(user, verification, analysis_results):
    """
    Validate uploaded document data against profile and verification data.
    Uses extracted structured data for better accuracy.
    Returns dict with 'valid' boolean and 'errors' list.
    """
    from profiles.models import Profile
    from users.models import Student
    
    result = {
        'valid': True,
        'errors': [],
        'conflicts': [],
        'extracted_data': analysis_results.get('extracted_data', {})
    }
    
    try:
        # Get profile and student data
        profile = Profile.objects.filter(user=user).first()
        student = Student.objects.filter(user=user).first()
        
        # Get extracted data from document
        extracted_data = analysis_results.get('extracted_data', {})
        ocr_text = analysis_results.get('ocr_text', '').lower()
        
        # SECURITY CHECK: Reject documents with insufficient OCR text
        if len(ocr_text) < 50:  # Minimum 50 characters required
            result['valid'] = False
            result['errors'].append(
                f"Insufficient text extracted from document ({len(ocr_text)} characters). Please upload a clearer image."
            )
            result['conflicts'].append({
                'field': 'ocr_quality',
                'expected': 'At least 50 characters',
                'found_in_document': f'{len(ocr_text)} characters'
            })
            return result  # Return early if OCR quality is too low
        
        # Validate university
        doc_university = extracted_data.get('university', '')
        expected_university = verification.university or (student.university if student else None)
        
        if expected_university and expected_university != 'Not specified':
            # Check extracted university first
            if doc_university:
                if expected_university.lower() not in doc_university.lower() and doc_university.lower() not in expected_university.lower():
                    result['valid'] = False
                    result['errors'].append(
                        f"University mismatch: Expected '{expected_university}', found '{doc_university}' in document"
                    )
                    result['conflicts'].append({
                        'field': 'university',
                        'expected': expected_university,
                        'found_in_document': doc_university
                    })
            else:
                # Fallback to OCR text search
                university_lower = expected_university.lower()
                university_words = [w for w in university_lower.split() if len(w) > 3]
                matches = sum(1 for word in university_words if word in ocr_text)
                
                if matches == 0:
                    result['valid'] = False
                    result['errors'].append(
                        f"University '{expected_university}' not found in document"
                    )
                    result['conflicts'].append({
                        'field': 'university',
                        'expected': expected_university,
                        'found_in_document': 'Not detected'
                    })
        
        # Validate student ID
        doc_student_id = extracted_data.get('student_id', '')
        expected_student_id = verification.student_id_number or (student.student_id if student else None)
        
        if expected_student_id:
            # Normalize for comparison (remove separators)
            def normalize_id(id_str):
                return id_str.replace('-', '').replace('/', '').replace(' ', '').lower()
            
            if doc_student_id:
                if normalize_id(expected_student_id) != normalize_id(doc_student_id):
                    result['valid'] = False
                    result['errors'].append(
                        f"Student ID mismatch: Expected '{expected_student_id}', found '{doc_student_id}' in document"
                    )
                    result['conflicts'].append({
                        'field': 'student_id',
                        'expected': expected_student_id,
                        'found_in_document': doc_student_id
                    })
            else:
                # Fallback to OCR text search
                expected_normalized = normalize_id(expected_student_id)
                ocr_normalized = normalize_id(ocr_text)
                
                if expected_normalized not in ocr_normalized:
                    result['valid'] = False
                    result['errors'].append(
                        f"Student ID '{expected_student_id}' not found in document"
                    )
                    result['conflicts'].append({
                        'field': 'student_id',
                        'expected': expected_student_id,
                        'found_in_document': 'Not detected'
                    })
        
        # Validate student name if available
        doc_name = extracted_data.get('student_name', '')
        user_name = f"{user.first_name} {user.last_name}".strip().upper()
        
        if doc_name and user_name and len(user_name) > 3:
            # Check if names match (allow partial matches)
            name_words = user_name.split()
            doc_name_upper = doc_name.upper()
            matches = sum(1 for word in name_words if len(word) > 2 and word in doc_name_upper)
            
            if matches == 0:
                # Warning but don't reject (names might be in different formats)
                result['errors'].append(
                    f"Name mismatch: Profile has '{user_name}', document shows '{doc_name}' (Warning only)"
                )
                result['conflicts'].append({
                    'field': 'name',
                    'expected': user_name,
                    'found_in_document': doc_name,
                    'severity': 'warning'
                })
        
        # Validate program/major if available
        doc_program = extracted_data.get('program', '')
        doc_major = extracted_data.get('major', '')
        expected_major = verification.major or (profile.major if profile else None)
        
        if expected_major and (doc_program or doc_major):
            program_text = f"{doc_program} {doc_major}".lower()
            if expected_major.lower() not in program_text:
                # Warning but don't reject (program names vary)
                result['errors'].append(
                    f"Major mismatch: Expected '{expected_major}', document shows '{doc_program}' (Warning only)"
                )
                result['conflicts'].append({
                    'field': 'major',
                    'expected': expected_major,
                    'found_in_document': doc_program or doc_major,
                    'severity': 'warning'
                })
        
    except Exception as e:
        logger.error(f"Error validating document against profile: {e}")
        # SECURITY FIX: On error, REJECT document (don't allow by default)
        result['valid'] = False
        result['errors'].append(
            f"Document validation error. Please try uploading again or contact support."
        )
    
    return result
