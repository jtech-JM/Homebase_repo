"""URL patterns for verification renewal."""

from django.urls import path
from . import renewal_views

app_name = 'verification_renewal'

urlpatterns = [
    # User endpoints
    path('my-expiration/', renewal_views.my_expiration_status, name='my_expiration'),
    path('request-renewal/', renewal_views.request_renewal, name='request_renewal'),
    path('my-renewals/', renewal_views.my_renewal_requests, name='my_renewals'),
    
    # Admin endpoints
    path('admin/pending/', renewal_views.pending_renewals, name='pending_renewals'),
    path('admin/process/<int:renewal_id>/', renewal_views.process_renewal_request, name='process_renewal'),
    path('admin/check-expirations/', renewal_views.check_all_expirations, name='check_expirations'),
    path('admin/statistics/', renewal_views.expiration_statistics, name='statistics'),
]
