"""URL patterns for verification status display."""

from django.urls import path
from . import verification_views

app_name = 'verification_display'

urlpatterns = [
    # User verification status
    path('my-status/', verification_views.my_verification_status, name='my_status'),
    path('badge/<int:user_id>/', verification_views.user_verification_badge, name='user_badge'),
    
    # Landlord views with verification
    path('landlord/applications/', verification_views.landlord_applications_with_verification, name='landlord_applications'),
    path('landlord/sorting-options/', verification_views.verification_sorting_options, name='sorting_options'),
    path('landlord/filter/', verification_views.filter_applications_by_verification, name='filter_applications'),
]
