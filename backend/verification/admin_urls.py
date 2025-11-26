"""URL configuration for admin verification review"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_review_views import AdminVerificationReviewViewSet

router = DefaultRouter()
router.register(r'reviews', AdminVerificationReviewViewSet, basename='admin-verification-review')

urlpatterns = [
    path('', include(router.urls)),
]
