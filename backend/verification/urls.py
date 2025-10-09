from rest_framework import routers
from .views import VerificationViewSet
router = routers.DefaultRouter()
router.register(r'verifications', VerificationViewSet)
urlpatterns = router.urls

from .views import ReviewViewSet, MessageViewSet

router.register(r'reviews', ReviewViewSet)
router.register(r'messages', MessageViewSet)
