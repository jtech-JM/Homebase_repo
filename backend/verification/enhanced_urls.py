from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import enhanced_views

# Create router for viewsets if needed
router = DefaultRouter()

urlpatterns = [
    # Student verification endpoints
    path('status/', enhanced_views.verification_status, name='verification-status'),
    path('initiate/', enhanced_views.initiate_verification, name='initiate-verification'),
    path('submit-step/', enhanced_views.submit_verification_step, name='submit-verification-step'),
    
    # Document upload
    path('upload-document/', enhanced_views.upload_document, name='upload-document'),
    
    # Email verification
    path('verify-email/', enhanced_views.verify_email, name='verify-email'),
    
    # Phone verification
    path('verify-phone/', enhanced_views.verify_phone, name='verify-phone'),
    
    # Peer verification
    path('peer-verification/', enhanced_views.submit_peer_verification, name='peer-verification'),
    
    # Agent endpoints
    path('agent/queue/', enhanced_views.agent_verification_queue, name='agent-verification-queue'),
    path('agent/review/<int:verification_id>/', enhanced_views.agent_review_verification, name='agent-review-verification'),
    
    # Statistics
    path('statistics/', enhanced_views.verification_statistics, name='verification-statistics'),
    
    # Include router URLs
    path('', include(router.urls)),
]