from rest_framework.routers import DefaultRouter
from .views import RoleViewSet, UserRoleViewSet

router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'user-roles', UserRoleViewSet)

urlpatterns = router.urls
