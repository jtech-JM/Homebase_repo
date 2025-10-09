from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, EscrowViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet)
router.register(r'escrow', EscrowViewSet)

urlpatterns = router.urls
