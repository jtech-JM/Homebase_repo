from rest_framework.routers import DefaultRouter
from .views import RoleViewSet, UserRoleViewSet, AdminDashboardViewSet

router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'user-roles', UserRoleViewSet)
router.register(r'admin', AdminDashboardViewSet, basename='admin')

urlpatterns = router.urls
