from rest_framework.routers import DefaultRouter
from .views import (
    ListingViewSet, BookingViewSet, MaintenanceRequestViewSet,
    PropertyDocumentViewSet
)

router = DefaultRouter()
router.register(r'listings', ListingViewSet, basename='listing')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(
    r'maintenance-requests',
    MaintenanceRequestViewSet,
    basename='maintenance-request'
)
router.register(
    r'property-documents',
    PropertyDocumentViewSet,
    basename='property-document'
)

urlpatterns = router.urls
