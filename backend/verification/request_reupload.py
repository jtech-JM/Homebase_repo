#!/usr/bin/env python
"""Script to request users to re-upload clearer images for low-quality OCR results"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'homebase_backend.settings')
django.setup()

from verification.enhanced_models import StudentVerification
from django.utils import timezone

print("\n" + "="*80)
print("REQUEST RE-UPLOAD FOR LOW QUALITY DOCUMENTS")
print("="*80 + "\n")

# Find verifications with low OCR confidence
low_quality_verifications = StudentVerification.objects.filter(
    overall_status__in=['pending', 'in_progress']
).exclude(student_id_document='')

print("Checking for low quality documents...\n")

reupload_requests = []

for verification in low_quality_verifications:
    if not verification.document_analysis_results:
        continue
    
    confidence = verification.document_analysis_results.get('confidence_score', 0)
    student_id_found = verification.document_analysis_results.get('student_id_found', False)
    university_found = verification.document_analysis_results.get('university_found', False)
    
    # Check if document quality is poor
    needs_reupload = (
        confidence < 70 or
        not student_id_found or
        not university_found
    )
    
    if needs_reupload:
        print(f"User: {verification.user.email}")
        print(f"  University: {verification.university}")
        print(f"  OCR Confidence: {confidence}%")
        print(f"  Student ID Found: {student_id_found}")
        print(f"  University Found: {university_found}")
        print(f"  Document: {verification.student_id_document.name}")
        
        # Update status to request additional info
        verification.overall_status = 'requires_additional_info'
        verification.agent_notes = (
            f"[{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}] System: "
            f"Document quality is too low (Confidence: {confidence}%). "
            f"Please upload a clearer image of your student ID. "
            f"Ensure the image is well-lit, in focus, and all text is clearly visible."
        )
        verification.save()
        
        reupload_requests.append({
            'user': verification.user.email,
            'verification_id': str(verification.verification_id),
            'confidence': confidence
        })
        
        print("  ✓ Status updated to 'requires_additional_info'")
        print("  ✓ User will be notified to re-upload\n")

print("-"*80)
print(f"\nTotal re-upload requests: {len(reupload_requests)}")

if reupload_requests:
    print("\nSummary:")
    for req in reupload_requests:
        print(f"  - {req['user']} (Confidence: {req['confidence']}%)")

print("\n" + "="*80 + "\n")
