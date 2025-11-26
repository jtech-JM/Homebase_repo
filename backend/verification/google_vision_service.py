"""Google Cloud Vision API service for OCR"""
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class GoogleVisionOCRService:
    """Service for extracting text from images using Google Cloud Vision API"""
    
    API_URL = "https://vision.googleapis.com/v1/images:annotate"
    
    @classmethod
    def extract_text_from_image(cls, image_path):
        """
        Extract text from image using Google Cloud Vision API.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            str: Extracted text from the image
        """
        try:
            # Read image file
            with open(image_path, 'rb') as image_file:
                image_content = image_file.read()
            
            # Convert to base64
            import base64
            image_base64 = base64.b64encode(image_content).decode('utf-8')
            
            # Prepare request
            api_key = settings.GOOGLE_CLOUD_VISION_API_KEY
            url = f"{cls.API_URL}?key={api_key}"
            
            payload = {
                "requests": [
                    {
                        "image": {
                            "content": image_base64
                        },
                        "features": [
                            {
                                "type": "TEXT_DETECTION",
                                "maxResults": 1
                            },
                            {
                                "type": "DOCUMENT_TEXT_DETECTION",
                                "maxResults": 1
                            }
                        ]
                    }
                ]
            }
            
            # Make API request
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            # Parse response
            result = response.json()
            
            if 'responses' in result and len(result['responses']) > 0:
                response_data = result['responses'][0]
                
                # Try DOCUMENT_TEXT_DETECTION first (better for documents)
                if 'fullTextAnnotation' in response_data:
                    extracted_text = response_data['fullTextAnnotation']['text']
                    logger.info(f"Google Vision extracted {len(extracted_text)} characters")
                    return extracted_text.strip()
                
                # Fallback to TEXT_DETECTION
                elif 'textAnnotations' in response_data and len(response_data['textAnnotations']) > 0:
                    extracted_text = response_data['textAnnotations'][0]['description']
                    logger.info(f"Google Vision extracted {len(extracted_text)} characters (fallback)")
                    return extracted_text.strip()
            
            logger.warning("No text detected in image by Google Vision")
            return ""
            
        except FileNotFoundError:
            logger.error(f"Image file not found: {image_path}")
            return ""
        except requests.exceptions.RequestException as e:
            logger.error(f"Google Vision API request failed: {e}")
            return ""
        except Exception as e:
            logger.error(f"Google Vision OCR extraction failed: {e}")
            return ""
    
    @classmethod
    def detect_logos(cls, image_path):
        """
        Detect logos in image using Google Cloud Vision API.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            list: List of detected logo descriptions
        """
        try:
            # Read image file
            with open(image_path, 'rb') as image_file:
                image_content = image_file.read()
            
            # Convert to base64
            import base64
            image_base64 = base64.b64encode(image_content).decode('utf-8')
            
            # Prepare request
            api_key = settings.GOOGLE_CLOUD_VISION_API_KEY
            url = f"{cls.API_URL}?key={api_key}"
            
            payload = {
                "requests": [
                    {
                        "image": {
                            "content": image_base64
                        },
                        "features": [
                            {
                                "type": "LOGO_DETECTION",
                                "maxResults": 5
                            }
                        ]
                    }
                ]
            }
            
            # Make API request
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            # Parse response
            result = response.json()
            
            if 'responses' in result and len(result['responses']) > 0:
                response_data = result['responses'][0]
                
                if 'logoAnnotations' in response_data:
                    logos = [logo['description'] for logo in response_data['logoAnnotations']]
                    logger.info(f"Google Vision detected {len(logos)} logos: {logos}")
                    return logos
            
            return []
            
        except Exception as e:
            logger.error(f"Google Vision logo detection failed: {e}")
            return []
    
    @classmethod
    def analyze_document(cls, image_path):
        """
        Comprehensive document analysis using Google Cloud Vision API.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            dict: Analysis results including text, logos, and confidence
        """
        results = {
            'ocr_text': '',
            'logos_detected': [],
            'has_text': False,
            'has_logo': False,
            'confidence': 0
        }
        
        try:
            # Extract text
            text = cls.extract_text_from_image(image_path)
            results['ocr_text'] = text
            results['has_text'] = len(text) > 20
            
            # Detect logos
            logos = cls.detect_logos(image_path)
            results['logos_detected'] = logos
            results['has_logo'] = len(logos) > 0
            
            # Calculate confidence
            confidence = 0
            if results['has_text']:
                confidence += 50
            if results['has_logo']:
                confidence += 30
            if len(text) > 100:
                confidence += 20
            
            results['confidence'] = min(confidence, 100)
            
            return results
            
        except Exception as e:
            logger.error(f"Google Vision document analysis failed: {e}")
            return results
