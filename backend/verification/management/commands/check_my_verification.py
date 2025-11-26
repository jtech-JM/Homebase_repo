"""
Quick command to check verification data for a specific user.
Usage: python manage.py check_my_verification --email gachihijoel234@gmail.com
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from verification.enhanced_models import StudentVerification
from verification.verification_services import DocumentAnalysisService
from profiles.models import Profile
from users.models import Student

User = get_user_model()


class Command(BaseCommand):
    help = 'Check verification data for a specific user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='User email address',
        )

    def handle(self, *args, **options):
        email = options['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User with email {email} not found'))
            return

        self.stdout.write(self.style.SUCCESS(f'\n{"="*80}'))
        self.stdout.write(self.style.SUCCESS(f'USER: {user.first_name} {user.last_name} ({user.email})'))
        self.stdout.write(self.style.SUCCESS(f'{"="*80}\n'))

        # Get profile
        profile = Profile.objects.filter(user=user).first()
        if profile:
            self.stdout.write(self.style.HTTP_INFO('PROFILE DATA:'))
            self.stdout.write(f'  Phone: {profile.phone}')
            self.stdout.write(f'  Address: {profile.address}')
            self.stdout.write(f'  Date of Birth: {profile.date_of_birth}')
            self.stdout.write(f'  Major: {profile.major}')
            self.stdout.write(f'  Graduation Year: {profile.graduation_year}')
            self.stdout.write(f'  Bio: {profile.bio[:50]}...' if profile.bio else '  Bio: (empty)')
        else:
            self.stdout.write(self.style.WARNING('No profile found'))

        # Get student
        student = Student.objects.filter(user=user).first()
        if student:
            self.stdout.write(self.style.HTTP_INFO('\nSTUDENT DATA:'))
            self.stdout.write(f'  University: {student.university}')
            self.stdout.write(f'  Student ID: {student.student_id}')
        else:
            self.stdout.write(self.style.WARNING('\nNo student record found'))

        # Get verification
        verification = StudentVerification.objects.filter(user=user).first()
        if verification:
            self.stdout.write(self.style.HTTP_INFO('\nVERIFICATION DATA:'))
            self.stdout.write(f'  Status: {verification.overall_status}')
            self.stdout.write(f'  Score: {verification.verification_score}')
            self.stdout.write(f'  University: {verification.university}')
            self.stdout.write(f'  Student ID: {verification.student_id_number}')
            self.stdout.write(f'  Major: {verification.major}')
            self.stdout.write(f'  Graduation Year: {verification.expected_graduation_year}')
            self.stdout.write(f'  Methods: {", ".join(verification.verification_methods)}')
            self.stdout.write(f'  Document Uploaded: {"Yes" if verification.student_id_document else "No"}')

            # Analyze document if exists
            if verification.student_id_document:
                self.stdout.write(self.style.HTTP_INFO('\nDOCUMENT ANALYSIS:'))
                self.stdout.write(f'  Document Path: {verification.student_id_document.path}')
                
                try:
                    analysis_results = DocumentAnalysisService.analyze_document(
                        verification.student_id_document.path,
                        verification.university
                    )

                    extracted_data = analysis_results.get('extracted_data', {})
                    
                    self.stdout.write(self.style.SUCCESS('\n  EXTRACTED DATA:'))
                    self.stdout.write(f'    University: {extracted_data.get("university", "❌ Not detected")}')
                    self.stdout.write(f'    Student Name: {extracted_data.get("student_name", "❌ Not detected")}')
                    self.stdout.write(f'    Student ID: {extracted_data.get("student_id", "❌ Not detected")}')
                    self.stdout.write(f'    Program: {extracted_data.get("program", "❌ Not detected")}')
                    self.stdout.write(f'    Major: {extracted_data.get("major", "❌ Not detected")}')
                    
                    self.stdout.write(f'\n  Confidence Score: {analysis_results.get("confidence_score", 0)}%')
                    self.stdout.write(f'  Valid: {"✓ Yes" if analysis_results.get("is_valid") else "✗ No"}')

                    # Compare with profile
                    self.stdout.write(self.style.WARNING('\n  COMPARISON:'))
                    
                    doc_uni = extracted_data.get('university', '')
                    profile_uni = student.university if student else ''
                    if doc_uni and profile_uni:
                        match = '✓' if doc_uni.upper() == profile_uni.upper() else '✗'
                        self.stdout.write(f'    University: {match}')
                        self.stdout.write(f'      Document: {doc_uni}')
                        self.stdout.write(f'      Profile:  {profile_uni}')
                    
                    doc_id = extracted_data.get('student_id', '')
                    profile_id = student.student_id if student else ''
                    if doc_id and profile_id:
                        match = '✓' if doc_id == profile_id else '✗'
                        self.stdout.write(f'    Student ID: {match}')
                        self.stdout.write(f'      Document: {doc_id}')
                        self.stdout.write(f'      Profile:  {profile_id}')

                    # Show OCR text
                    self.stdout.write(self.style.HTTP_INFO('\n  OCR TEXT:'))
                    ocr_text = analysis_results.get('ocr_text', '')
                    if ocr_text:
                        lines = ocr_text.split('\n')[:15]  # First 15 lines
                        for line in lines:
                            if line.strip():
                                self.stdout.write(f'    {line}')
                    else:
                        self.stdout.write('    (No text extracted)')

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'\n  Error: {e}'))
        else:
            self.stdout.write(self.style.WARNING('\nNo verification found'))

        self.stdout.write(self.style.SUCCESS(f'\n{"="*80}\n'))
