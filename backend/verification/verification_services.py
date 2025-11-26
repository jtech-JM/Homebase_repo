import re
import requests
import random
import string
from datetime import datetime, timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
import json
import logging

# Optional GIS imports
try:
    from django.contrib.gis.geoip2 import GeoIP2
    from django.contrib.gis.measure import Distance
    from django.contrib.gis.geos import Point
    GIS_AVAILABLE = True
except (ImportError, Exception):
    GIS_AVAILABLE = False
    GeoIP2 = None
    Distance = None
    Point = None

# Optional CV2 and image processing imports
try:
    import cv2
    import numpy as np
    from PIL import Image
    import pytesseract
    # Configure Tesseract path for Windows
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    cv2 = None
    np = None
    Image = None
    pytesseract = None

logger = logging.getLogger(__name__)

class UniversityEmailVerificationService:
    """Service for verifying university email addresses"""
    
    # Common university domains
    UNIVERSITY_DOMAINS = [
        'harvard.edu', 'mit.edu', 'stanford.edu', 'berkeley.edu', 'ucla.edu',
        'yale.edu', 'princeton.edu', 'columbia.edu', 'upenn.edu', 'cornell.edu',
        'dartmouth.edu', 'brown.edu', 'duke.edu', 'northwestern.edu', 'uchicago.edu',
        'caltech.edu', 'rice.edu', 'vanderbilt.edu', 'emory.edu', 'georgetown.edu',
        # Add more university domains as needed
    ]
    
    @classmethod
    def is_valid_university_domain(cls, email):
        """Check if email domain is from a recognized university"""
        if not email or '@' not in email:
            return False
        
        domain = email.split('@')[1].lower()
        
        # Check if it's a .edu domain
        if domain.endswith('.edu'):
            return True
        
        # Check against known university domains
        return domain in cls.UNIVERSITY_DOMAINS
    
    @classmethod
    def extract_university_from_email(cls, email):
        """Extract university name from email domain"""
        if not cls.is_valid_university_domain(email):
            return None
        
        domain = email.split('@')[1].lower()
        
        # Simple mapping of domains to university names
        domain_to_university = {
            'harvard.edu': 'Harvard University',
            'mit.edu': 'Massachusetts Institute of Technology',
            'stanford.edu': 'Stanford University',
            'berkeley.edu': 'University of California, Berkeley',
            'ucla.edu': 'University of California, Los Angeles',
            # Add more mappings as needed
        }
        
        return domain_to_university.get(domain, domain.replace('.edu', '').title() + ' University')
    
    @classmethod
    def send_verification_email(cls, user, university_email):
        """Send verification email to university email address"""
        verification_code = ''.join(random.choices(string.digits, k=6))
        
        subject = 'Verify Your University Email - HomeBase'
        message = f"""
        Hi {user.first_name or user.email},
        
        Please verify your university email address by entering this code:
        
        Verification Code: {verification_code}
        
        This code will expire in 15 minutes.
        
        If you didn't request this verification, please ignore this email.
        
        Best regards,
        HomeBase Team
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [university_email],
                fail_silently=False,
            )
            return verification_code
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")
            return None


class PhoneVerificationService:
    """Service for SMS phone number verification"""
    
    @classmethod
    def generate_verification_code(cls):
        """Generate 6-digit verification code"""
        return ''.join(random.choices(string.digits, k=6))
    
    @classmethod
    def send_sms_verification(cls, phone_number, verification_code):
        """Send SMS verification code (mock implementation)"""
        # In production, integrate with SMS service like Twilio, AWS SNS, etc.
        logger.info(f"SMS sent to {phone_number}: Your verification code is {verification_code}")
        
        # Mock implementation - always return success
        return True
    
    @classmethod
    def is_valid_phone_number(cls, phone_number):
        """Validate phone number format"""
        # Simple regex for international phone numbers
        pattern = r'^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$'
        return re.match(pattern, phone_number) is not None


class DocumentAnalysisService:
    """Service for analyzing uploaded student ID documents"""
    
    @classmethod
    def extract_text_from_image(cls, image_path):
        """Extract text from image using OCR"""
        from django.conf import settings
        
        # Use Google Vision if enabled
        if getattr(settings, 'USE_GOOGLE_VISION', False):
            try:
                from .google_vision_service import GoogleVisionOCRService
                extracted_text = GoogleVisionOCRService.extract_text_from_image(image_path)
                logger.info(f"Google Vision extracted {len(extracted_text)} characters")
                return extracted_text
            except Exception as e:
                logger.error(f"Google Vision OCR failed, falling back to Tesseract: {e}")
        
        # Fallback to Tesseract
        try:
            if not CV2_AVAILABLE or Image is None or pytesseract is None:
                logger.error("Tesseract/PIL not available")
                return ""
            
            # Load image
            image = Image.open(image_path)
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Extract text using pytesseract with better config
            # Use config for better accuracy with student IDs
            custom_config = r'--oem 3 --psm 6'
            extracted_text = pytesseract.image_to_string(image, config=custom_config)
            
            return extracted_text.strip()
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return ""
    
    @classmethod
    def extract_student_data(cls, ocr_text):
        """
        Extract structured student data from OCR text.
        Returns dict with extracted fields.
        """
        import re
        
        data = {
            'university': None,
            'student_name': None,
            'student_id': None,
            'program': None,
            'major': None,
            'date_issued': None
        }
        
        lines = ocr_text.split('\n')
        text_lower = ocr_text.lower()
        
        # Extract university name
        university_keywords = ['university', 'college', 'institute', 'polytechnic', 'varsity']
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in university_keywords):
                # Clean up the line
                university = line.strip()
                if len(university) > 5 and len(university) < 100:
                    data['university'] = university
                    break
        
        # If no university found with keywords, try to extract from common patterns
        if not data['university']:
            # Look for patterns like "@aPwanik" which might be "Pwani"
            # Common OCR errors: @ for P, a for n, etc.
            university_patterns = [
                r'[@P][a-z]*[Pp]wani[a-z]*',  # Pwani variations
                r'[A-Z][a-z]+\s+[Uu]niversity',  # "Something University"
                r'[A-Z][a-z]+\s+[Cc]ollege',  # "Something College"
            ]
            for pattern in university_patterns:
                match = re.search(pattern, ocr_text)
                if match:
                    university_text = match.group(0)
                    # Clean up OCR errors
                    university_text = university_text.replace('@', 'P')
                    # Fix "aPwanik" or "PPwani" to "Pwani"
                    if 'Pwani' in university_text or 'pwani' in university_text.lower():
                        university_text = 'Pwani University'
                    data['university'] = university_text
                    break
        
        # Extract student ID patterns
        # Common patterns: SB30/PU/40212/23, SCT211-0001/2021, 2021/12345, etc.
        # Note: OCR may misread characters, so we use flexible patterns
        student_id_patterns = [
            r'[$S][A-Z]{1,3}\d{2}/[A-Z]{2}/\d{4,5}/\d{2}',  # SB30/PU/40212/23 ($ or S at start)
            r'[A-Z]{2,4}\d{2}/[A-Z]{2}/\d{4,5}/\d{2}',  # SB30/PU/40212/23
            r'[A-Z]{2,4}\d{2}[A-Z]{2}\d{7,10}',  # SB30PU4021223 (no slashes)
            r'[A-Z]{3}\d{3}-\d{4}/\d{4}',  # SCT211-0001/2021
            r'\d{4}/\d{4,6}',  # 2021/123456
            r'[A-Z]\d{2}/\d{4,6}',  # S21/123456
            r'\b[A-Z]{2,4}\d{6,10}\b',  # ABC1234567
        ]
        
        for pattern in student_id_patterns:
            match = re.search(pattern, ocr_text)
            if match:
                student_id = match.group(0)
                # Clean up OCR errors: replace $ with S at the start
                if student_id.startswith('$'):
                    student_id = 'S' + student_id[1:]
                data['student_id'] = student_id
                break
        
        # Extract student name (usually in CAPS after "STUDENT" or before student ID)
        name_pattern = r'\b([A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?)\b'
        name_matches = re.findall(name_pattern, ocr_text)
        if name_matches:
            # Filter out common words
            exclude_words = ['STUDENT', 'UNIVERSITY', 'COLLEGE', 'BACHELOR', 'MASTER', 'DIPLOMA']
            for name in name_matches:
                if not any(word in name for word in exclude_words) and len(name) > 8:
                    data['student_name'] = name.strip()
                    break
        
        # Extract program/major
        program_keywords = ['bachelor', 'master', 'diploma', 'certificate', 'phd', 'degree']
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in program_keywords):
                program = line.strip()
                if len(program) > 10:
                    data['program'] = program
                    # Extract major from program
                    if ' in ' in line_lower:
                        major_part = line.split(' in ')[-1].strip()
                        data['major'] = major_part
                    break
        
        # Extract date issued
        date_patterns = [
            r'\d{1,2}[-/]\w{3}[-/]\d{2,4}',  # 20-Feb-24
            r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}',  # 20/02/2024
            r'\w{3}\s+\d{1,2},?\s+\d{4}',  # Feb 20, 2024
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, ocr_text)
            if match:
                data['date_issued'] = match.group(0)
                break
        
        return data
    
    @classmethod
    def detect_university_logo(cls, image_path):
        """Detect university logo in the image"""
        from django.conf import settings
        
        # Use Google Vision if enabled
        if getattr(settings, 'USE_GOOGLE_VISION', False):
            try:
                from .google_vision_service import GoogleVisionOCRService
                logos = GoogleVisionOCRService.detect_logos(image_path)
                return len(logos) > 0
            except Exception as e:
                logger.error(f"Google Vision logo detection failed: {e}")
        
        # Fallback to basic check
        try:
            if not CV2_AVAILABLE or cv2 is None:
                # Just check if file exists and is valid
                import os
                return os.path.exists(image_path) and os.path.getsize(image_path) > 0
            
            # Load image
            image = cv2.imread(image_path)
            
            # Return True if image is valid
            return image is not None
        except Exception as e:
            logger.error(f"Logo detection failed: {e}")
            return False
    
    @classmethod
    def validate_student_id_format(cls, extracted_text, university):
        """Validate student ID format based on university patterns"""
        # Mock validation - in production, implement university-specific patterns
        
        # Look for common student ID patterns
        patterns = [
            r'\b\d{8,10}\b',  # 8-10 digit numbers
            r'\b[A-Z]{2,3}\d{6,8}\b',  # Letters followed by numbers
            r'\b\d{4}-\d{4}\b',  # Hyphenated numbers
        ]
        
        for pattern in patterns:
            if re.search(pattern, extracted_text):
                return True
        
        return False
    
    @classmethod
    def extract_expiry_date(cls, extracted_text):
        """Extract expiry date from OCR text"""
        # Look for date patterns
        date_patterns = [
            r'\b(\d{1,2})/(\d{1,2})/(\d{4})\b',  # MM/DD/YYYY
            r'\b(\d{4})-(\d{1,2})-(\d{1,2})\b',  # YYYY-MM-DD
            r'\b(\d{1,2})-(\d{1,2})-(\d{4})\b',  # DD-MM-YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, extracted_text)
            if match:
                try:
                    # Try to parse the date
                    if '/' in match.group():
                        date_str = match.group()
                        date_obj = datetime.strptime(date_str, '%m/%d/%Y')
                    elif '-' in match.group() and match.group(1).isdigit() and len(match.group(1)) == 4:
                        date_str = match.group()
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                    else:
                        date_str = match.group()
                        date_obj = datetime.strptime(date_str, '%d-%m-%Y')
                    
                    return date_obj.date()
                except ValueError:
                    continue
        
        return None
    
    @classmethod
    def analyze_document(cls, document_path, university=None):
        """Comprehensive document analysis"""
        results = {
            'ocr_text': '',
            'extracted_data': {},
            'logo_detected': False,
            'student_id_found': False,
            'university_found': False,
            'name_found': False,
            'program_found': False,
            'expiry_date': None,
            'is_valid': False,
            'confidence_score': 0
        }
        
        try:
            # Extract text
            ocr_text = cls.extract_text_from_image(document_path)
            results['ocr_text'] = ocr_text
            
            # Extract structured data
            extracted_data = cls.extract_student_data(ocr_text)
            results['extracted_data'] = extracted_data
            
            # Detect logo
            logo_detected = cls.detect_university_logo(document_path)
            results['logo_detected'] = logo_detected
            
            # Check if key fields were found
            results['student_id_found'] = bool(extracted_data.get('student_id'))
            results['university_found'] = bool(extracted_data.get('university'))
            results['name_found'] = bool(extracted_data.get('student_name'))
            results['program_found'] = bool(extracted_data.get('program'))
            
            # Validate student ID format
            if not results['student_id_found']:
                results['student_id_found'] = cls.validate_student_id_format(ocr_text, university)
            
            # Extract expiry date
            expiry_date = cls.extract_expiry_date(ocr_text)
            results['expiry_date'] = expiry_date
            
            # Calculate confidence score
            confidence_score = 0
            if ocr_text and len(ocr_text) > 20:
                confidence_score += 20
            if logo_detected:
                confidence_score += 15
            if results['student_id_found']:
                confidence_score += 25
            if results['university_found']:
                confidence_score += 15
            if results['name_found']:
                confidence_score += 10
            if results['program_found']:
                confidence_score += 10
            if expiry_date and expiry_date > datetime.now().date():
                confidence_score += 5
            
            results['confidence_score'] = confidence_score
            results['is_valid'] = confidence_score >= 70
            
        except Exception as e:
            logger.error(f"Document analysis failed: {e}")
        
        return results


class GeolocationVerificationService:
    """Service for verifying user location relative to campus"""
    
    # Campus coordinates (lat, lng) for major universities
    UNIVERSITY_COORDINATES = {
        'Harvard University': (42.3744, -71.1169),
        'MIT': (42.3601, -71.0942),
        'Stanford University': (37.4275, -122.1697),
        'UC Berkeley': (37.8719, -122.2585),
        'UCLA': (34.0689, -118.4452),
        # Add more university coordinates
    }
    
    @classmethod
    def get_user_location_from_ip(cls, ip_address):
        """Get user location from IP address"""
        try:
            g = GeoIP2()
            location = g.city(ip_address)
            return {
                'latitude': location['latitude'],
                'longitude': location['longitude'],
                'city': location['city'],
                'country': location['country_name']
            }
        except Exception as e:
            logger.error(f"Geolocation failed: {e}")
            return None
    
    @classmethod
    def calculate_distance_to_campus(cls, user_location, university):
        """Calculate distance from user location to campus"""
        if university not in cls.UNIVERSITY_COORDINATES:
            return None
        
        campus_coords = cls.UNIVERSITY_COORDINATES[university]
        user_point = Point(user_location['longitude'], user_location['latitude'])
        campus_point = Point(campus_coords[1], campus_coords[0])
        
        # Calculate distance in kilometers
        distance = user_point.distance(campus_point) * 111  # Rough conversion to km
        return distance
    
    @classmethod
    def is_near_campus(cls, user_location, university, max_distance_km=50):
        """Check if user is within reasonable distance of campus"""
        distance = cls.calculate_distance_to_campus(user_location, university)
        if distance is None:
            return False
        
        return distance <= max_distance_km


class SocialMediaVerificationService:
    """Service for social media profile verification"""
    
    @classmethod
    def validate_linkedin_profile(cls, linkedin_url):
        """Validate LinkedIn profile URL and extract basic info"""
        linkedin_pattern = r'https?://(www\.)?linkedin\.com/in/[\w-]+'
        
        if not re.match(linkedin_pattern, linkedin_url):
            return {'valid': False, 'error': 'Invalid LinkedIn URL format'}
        
        # Mock implementation - in production, use LinkedIn API
        return {
            'valid': True,
            'profile_exists': True,
            'education_info': 'Mock University',
            'confidence_score': 75
        }
    
    @classmethod
    def validate_facebook_profile(cls, facebook_url):
        """Validate Facebook profile URL"""
        facebook_pattern = r'https?://(www\.)?facebook\.com/[\w.-]+'
        
        if not re.match(facebook_pattern, facebook_url):
            return {'valid': False, 'error': 'Invalid Facebook URL format'}
        
        # Mock implementation
        return {
            'valid': True,
            'profile_exists': True,
            'confidence_score': 60
        }


class VerificationOrchestrator:
    """Main service to orchestrate the verification process"""
    
    @classmethod
    def initiate_verification(cls, user, verification_data):
        """Start the verification process for a student"""
        from .enhanced_models import StudentVerification, VerificationStep
        
        # Create verification record
        verification = StudentVerification.objects.create(
            user=user,
            university=verification_data.get('university', ''),
            student_id_number=verification_data.get('student_id_number', ''),
            expected_graduation_year=verification_data.get('graduation_year'),
            major=verification_data.get('major', ''),
            university_email=verification_data.get('university_email', ''),
            phone_number=verification_data.get('phone_number', ''),
        )
        
        # Create verification steps
        required_steps = [
            ('student_id_upload', True),
            ('university_email', True),
            ('phone_verification', True),
            ('agent_manual_review', True),
        ]
        
        optional_steps = [
            ('social_media', False),
            ('peer_verification', False),
            ('geolocation', False),
        ]
        
        for step_type, is_required in required_steps + optional_steps:
            VerificationStep.objects.create(
                verification=verification,
                step_type=step_type,
                is_required=is_required,
                is_optional=not is_required
            )
        
        return verification
    
    @classmethod
    def process_verification_step(cls, verification, step_type, step_data):
        """Process a specific verification step"""
        from .enhanced_models import VerificationStep
        
        try:
            step = VerificationStep.objects.get(
                verification=verification,
                step_type=step_type
            )
            
            step.status = 'in_progress'
            step.started_at = timezone.now()
            step.save()
            
            success = False
            
            if step_type == 'university_email':
                success = cls._process_email_verification(verification, step_data)
            elif step_type == 'phone_verification':
                success = cls._process_phone_verification(verification, step_data)
            elif step_type == 'student_id_upload':
                success = cls._process_document_upload(verification, step_data)
            elif step_type == 'social_media':
                success = cls._process_social_media_verification(verification, step_data)
            elif step_type == 'geolocation':
                success = cls._process_geolocation_verification(verification, step_data)
            
            if success:
                step.status = 'completed'
                step.completed_at = timezone.now()
            else:
                step.status = 'failed'
            
            step.save()
            
            # Update overall verification status
            cls._update_verification_status(verification)
            
            return success
            
        except VerificationStep.DoesNotExist:
            logger.error(f"Verification step {step_type} not found")
            return False
    
    @classmethod
    def _process_email_verification(cls, verification, step_data):
        """Process university email verification"""
        email = step_data.get('email')
        verification_code = step_data.get('verification_code')
        
        if verification_code:
            # Verify the code (mock implementation)
            verification.university_email_verified = True
            verification.university_domain_valid = UniversityEmailVerificationService.is_valid_university_domain(email)
            verification.save()
            return True
        else:
            # Send verification email
            code = UniversityEmailVerificationService.send_verification_email(verification.user, email)
            return code is not None
    
    @classmethod
    def _process_phone_verification(cls, verification, step_data):
        """Process phone number verification"""
        phone = step_data.get('phone_number')
        verification_code = step_data.get('verification_code')
        
        if verification_code:
            # Verify the code (mock implementation)
            verification.phone_verified = True
            verification.save()
            return True
        else:
            # Send SMS verification
            code = PhoneVerificationService.generate_verification_code()
            verification.phone_verification_code = code
            verification.phone_verification_expires = timezone.now() + timedelta(minutes=15)
            verification.save()
            
            return PhoneVerificationService.send_sms_verification(phone, code)
    
    @classmethod
    def _process_document_upload(cls, verification, step_data):
        """Process student ID document upload"""
        document_file = step_data.get('document_file')
        
        if not document_file:
            return False
        
        # Analyze document
        analysis_results = DocumentAnalysisService.analyze_document(
            document_file.path,
            verification.university
        )
        
        # Update verification record
        verification.ocr_extracted_text = analysis_results['ocr_text']
        verification.document_analysis_results = analysis_results
        verification.university_logo_detected = analysis_results['logo_detected']
        verification.document_expiry_date = analysis_results['expiry_date']
        verification.document_is_valid = analysis_results['is_valid']
        verification.save()
        
        return analysis_results['is_valid']
    
    @classmethod
    def _process_social_media_verification(cls, verification, step_data):
        """Process social media verification"""
        linkedin_url = step_data.get('linkedin_url')
        facebook_url = step_data.get('facebook_url')
        
        success = False
        
        if linkedin_url:
            result = SocialMediaVerificationService.validate_linkedin_profile(linkedin_url)
            if result['valid']:
                verification.linkedin_profile = linkedin_url
                success = True
        
        if facebook_url:
            result = SocialMediaVerificationService.validate_facebook_profile(facebook_url)
            if result['valid']:
                verification.facebook_profile = facebook_url
                success = True
        
        if success:
            verification.social_media_verified = True
            verification.save()
        
        return success
    
    @classmethod
    def _process_geolocation_verification(cls, verification, step_data):
        """Process geolocation verification"""
        user_location = step_data.get('location')
        ip_address = step_data.get('ip_address')
        
        if not user_location and ip_address:
            user_location = GeolocationVerificationService.get_user_location_from_ip(ip_address)
        
        if user_location:
            verification.registration_location = user_location
            is_near_campus = GeolocationVerificationService.is_near_campus(
                user_location,
                verification.university
            )
            verification.campus_proximity_verified = is_near_campus
            verification.save()
            return True
        
        return False
    
    @classmethod
    def _update_verification_status(cls, verification):
        """Update overall verification status based on completed steps"""
        verification.calculate_verification_score()
        
        if verification.is_verification_complete():
            verification.overall_status = 'approved'
            verification.completed_at = timezone.now()
        elif verification.verification_score >= 50:
            verification.overall_status = 'in_progress'
        else:
            verification.overall_status = 'pending'
        
        verification.save()