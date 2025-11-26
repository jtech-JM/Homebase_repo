"""Enhanced URL patterns for listings with verification-based access control."""

from django.urls import path
from . import enhanced_views

app_name = 'listings_enhanced'

urlpatterns = [
    # Enhanced listing views with access control
    path('', enhanced_views.listing_list_with_access_control, name='listing_list_enhanced'),
    path('<int:listing_id>/', enhanced_views.listing_detail_with_access_control, name='listing_detail_enhanced'),
    
    # API endpoints for access control
    path('api/access-check/<int:listing_id>/', enhanced_views.listing_access_check_api, name='access_check_api'),
    path('api/pricing/<int:listing_id>/', enhanced_views.listing_pricing_api, name='pricing_api'),
    path('api/my-benefits/', enhanced_views.my_verification_benefits_api, name='my_benefits_api'),
    
    # Contact landlord with verification
    path('api/contact/<int:listing_id>/', enhanced_views.contact_landlord_with_verification, name='contact_landlord_api'),
]
