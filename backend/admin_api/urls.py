from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserManagementViewSet, basename='admin-users')
router.register(r'support/tickets', views.SupportTicketViewSet, basename='admin-tickets')

urlpatterns = [
    # Dashboard
    path('dashboard/', views.dashboard_overview, name='admin-dashboard'),
    
    # Properties
    path('properties/', views.property_management_list, name='admin-properties'),
    path('properties/<int:property_id>/update_status/', views.property_update_status, name='admin-property-status'),
    path('properties/<int:property_id>/toggle_verification/', views.property_toggle_verification, name='admin-property-verification'),
    
    # Applications
    path('applications/', views.application_management_list, name='admin-applications'),
    path('applications/<int:application_id>/', views.application_update, name='admin-application-update'),
    
    # Payments
    path('payments/', views.payment_management_list, name='admin-payments'),
    path('payments/<int:payment_id>/<str:action>/', views.payment_action, name='admin-payment-action'),
    
    # Reports
    path('reports/', views.reports_analytics, name='admin-reports'),
    
    # Settings
    path('settings/', views.platform_settings, name='admin-settings'),
    
    # Router URLs (users and support tickets)
    path('', include(router.urls)),
]
