"""
Management command to verify existing uploaded documents against profile data.
Usage: python manage.py verify_existing_documents
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from verification.enhanced_models import StudentVerification
from verification.verification_services import DocumentAnalysisService
from profiles.models import Profile
from users.models import Student
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Verify existing uploaded documents against profile data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='Verify documents for a specific user ID',
        )
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Automatically fix mismatches by updating profile data from document',
        )

    def handle(self, *args, **options):
        user_id = options.get('user_id')
        auto_fix = options.get('fix', False)

        if user_id:
            verifications = StudentVerification.objects.filter(user_id=user_id, student_id_document__isnull=False)
        else:
            verifications = StudentVerification.objects.filter(student_id_document__isnull=False)

        self.stdout.write(self.style.SUCCESS(f'\nFound {verifications.count()} verifications with documents\n'))

        for verification in verifications:
            self.stdout.write(self.style.WARNING(f'\n{"="*80}'))
            self.stdout.write(self.style.WARNING(f'User: {verification.user.email} (ID: {verification.user.id})'))
            self.stdout.write(self.style.WARNING(f'Verification Status: {verification.overall_status}'))
            self.stdout.write(self.style.WARNING(f'{"="*80}\n'))

            # Get profile and student data
            profile = Profile.objects.filter(user=verification.user).first()
            student = Student.objects.filter(user=verification.user).first()

            # Display current data
            self.stdout.write(self.style.HTTP_INFO('CURRENT PROFILE DATA:'))
            if student:
                self.stdout.write(f'  University: {student.university}')
                self.stdout.write(f'  Student ID: {student.student_id}')
            if profile:
                self.stdout.write(f'  Major: {profile.major}')
                self.stdout.write(f'  Graduation Year: {profile.graduation_year}')

            self.stdout.write(self.style.HTTP_INFO('\nCURRENT VERIFICATION DATA:'))
            self.stdout.write(f'  University: {verification.university}')
            self.stdout.write(f'  Student ID: {verification.student_id_number}')
            self.stdout.write(f'  Major: {verification.major}')
            self.stdout.write(f'  Graduation Year: {verification.expected_graduation_year}')

            # Analyze the document
            if verification.student_id_document:
                self.stdout.write(self.style.HTTP_INFO('\nANALYZING DOCUMENT...'))
                try:
                    analysis_results = DocumentAnalysisService.analyze_document(
                        verification.student_id_document.path,
                        verification.university
                    )

                    extracted_data = analysis_results.get('extracted_data', {})
                    
                    self.stdout.write(self.style.SUCCESS('\nEXTRACTED FROM DOCUMENT:'))
                    self.stdout.write(f'  University: {extracted_data.get("university", "Not detected")}')
                    self.stdout.write(f'  Student Name: {extracted_data.get("student_name", "Not detected")}')
                    self.stdout.write(f'  Student ID: {extracted_data.get("student_id", "Not detected")}')
                    self.stdout.write(f'  Program: {extracted_data.get("program", "Not detected")}')
                    self.stdout.write(f'  Major: {extracted_data.get("major", "Not detected")}')
                    self.stdout.write(f'  Date Issued: {extracted_data.get("date_issued", "Not detected")}')
                    self.stdout.write(f'\n  Confidence Score: {analysis_results.get("confidence_score", 0)}%')
                    self.stdout.write(f'  Document Valid: {analysis_results.get("is_valid", False)}')

                    # Check for mismatches
                    mismatches = []
                    
                    # Check university
                    doc_university = extracted_data.get('university', '')
                    if doc_university and student and student.university:
                        if doc_university.upper() != student.university.upper():
                            mismatches.append({
                                'field': 'university',
                                'profile': student.university,
                                'document': doc_university
                            })
                    
                    # Check student ID
                    doc_student_id = extracted_data.get('student_id', '')
                    if doc_student_id and student and student.student_id:
                        if doc_student_id != student.student_id:
                            mismatches.append({
                                'field': 'student_id',
                                'profile': student.student_id,
                                'document': doc_student_id
                            })

                    if mismatches:
                        self.stdout.write(self.style.ERROR('\n⚠️  MISMATCHES FOUND:'))
                        for mismatch in mismatches:
                            self.stdout.write(self.style.ERROR(
                                f'  {mismatch["field"].upper()}:\n'
                                f'    Profile: {mismatch["profile"]}\n'
                                f'    Document: {mismatch["document"]}'
                            ))

                        if auto_fix:
                            self.stdout.write(self.style.WARNING('\n🔧 FIXING MISMATCHES...'))
                            
                            # Update profile/student with document data
                            if student:
                                for mismatch in mismatches:
                                    if mismatch['field'] == 'university':
                                        student.university = mismatch['document']
                                    elif mismatch['field'] == 'student_id':
                                        student.student_id = mismatch['document']
                                student.save()
                                self.stdout.write(self.style.SUCCESS('  ✓ Student record updated'))

                            # Update verification
                            if extracted_data.get('university'):
                                verification.university = extracted_data['university']
                            if extracted_data.get('student_id'):
                                verification.student_id_number = extracted_data['student_id']
                            if extracted_data.get('major'):
                                verification.major = extracted_data['major']
                            
                            verification.save()
                            self.stdout.write(self.style.SUCCESS('  ✓ Verification record updated'))
                    else:
                        self.stdout.write(self.style.SUCCESS('\n✓ All data matches!'))

                    # Display OCR text for debugging
                    if options.get('verbosity', 1) >= 2:
                        self.stdout.write(self.style.HTTP_INFO('\nOCR TEXT:'))
                        self.stdout.write(analysis_results.get('ocr_text', 'No text extracted'))

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'\n✗ Error analyzing document: {e}'))
                    logger.error(f'Error analyzing document for user {verification.user.id}: {e}', exc_info=True)

        self.stdout.write(self.style.SUCCESS('\n\nVerification complete!\n'))
