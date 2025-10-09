from rest_framework import routers
from .views import UserViewSet, StudentViewSet, LandlordViewSet, AgentViewSet

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'students', StudentViewSet)
router.register(r'landlords', LandlordViewSet)
router.register(r'agents', AgentViewSet)

urlpatterns = router.urls
