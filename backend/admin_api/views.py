from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q, Avg
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import PlatformSettings, AdminActivityLog
from support.models import SupportTicket, SupportMessage
from .serializers import (
    UserManagementSerializer, PropertyManagementSerializer,
    ApplicationManagementSerializer, PaymentManagementSerializer,
    DashboardStatsSerializer, DashboardAlertSerializer,
    PlatformSettingsSerializer, SupportTicketSerializer,
    SupportTicketListSerializer, TicketMessageSerializer,
    ReportStatsSerializer, AdminActivityLogSerializer
)
from .permissions import IsAdminUser
from .utils import log_admin_action, get_client_ip
from users.permissions import IsAgent

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def dashboard_overview(request):
    """
    Get dashboard overview statistics and alerts
    """
    try:
        # Import models dynamically to avoid circular imports
        from listings.models import Listing
        from django.apps import apps
        
        # Try to get Application and Payment models
        try:
            Application = apps.get_model('listings', 'Application')
        except LookupError:
            Application = None
        
        try:
            Payment = apps.get_model('payments', 'Payment')
        except LookupError:
            Payment = None
        
        # Calculate statistics
        total_students = User.objects.filter(role='student').count()
        total_landlords = User.objects.filter(role='landlord').count()
        active_listings = Listing.objects.filter(status='available').count()
        
        pending_applications = 0
        if Application:
            pending_applications = Application.objects.filter(status='pending').count()
        
        # Calculate revenue (last 30 days)
        revenue = Decimal('0.00')
        if Payment:
            thirty_days_ago = timezone.now() - timedelta(days=30)
            revenue_sum = Payment.objects.filter(
                status='completed',
                created_at__gte=thirty_days_ago
            ).aggregate(total=Sum('amount'))['total']
            revenue = revenue_sum or Decimal('0.00')
        
        stats = {
            'totalStudents': total_students,
            'totalLandlords': total_landlords,
            'activeListings': active_listings,
            'pendingApplications': pending_applications,
            'revenue': float(revenue)
        }
        
        # Generate alerts
        alerts = []
        
        # Check for pending verifications
        pending_verifications = User.objects.filter(is_active=False).count()
        if pending_verifications > 0:
            alerts.append({
                'title': 'Pending User Verifications',
                'description': f'{pending_verifications} users awaiting verification',
                'time': 'Now',
                'severity': 'warning'
            })
        
        # Check for urgent support tickets
        urgent_tickets = SupportTicket.objects.filter(
            status='open',
            priority='urgent'
        ).count()
        if urgent_tickets > 0:
            alerts.append({
                'title': 'Urgent Support Tickets',
                'description': f'{urgent_tickets} urgent tickets require immediate attention',
                'time': 'Now',
                'severity': 'critical'
            })
        
        # Get recent activities from multiple sources
        recent_activities = []
        
        # 1. Recent user registrations (last 10)
        recent_users = User.objects.filter(
            date_joined__gte=timezone.now() - timedelta(days=7)
        ).order_by('-date_joined')[:5]
        
        for user in recent_users:
            time_diff = timezone.now() - user.date_joined
            if time_diff.total_seconds() < 3600:
                time_str = f"{int(time_diff.total_seconds() / 60)} minutes ago"
            elif time_diff.total_seconds() < 86400:
                time_str = f"{int(time_diff.total_seconds() / 3600)} hours ago"
            else:
                time_str = f"{int(time_diff.days)} days ago"
            
            recent_activities.append({
                'action': 'New User Registration',
                'user': user.email,
                'time': time_str,
                'status': 'Completed',
                'type': 'user'
            })
        
        # 2. Recent property listings (last 5)
        recent_listings = Listing.objects.select_related('landlord').order_by('-created_at')[:5]
        
        for listing in recent_listings:
            time_diff = timezone.now() - listing.created_at
            if time_diff.total_seconds() < 3600:
                time_str = f"{int(time_diff.total_seconds() / 60)} minutes ago"
            elif time_diff.total_seconds() < 86400:
                time_str = f"{int(time_diff.total_seconds() / 3600)} hours ago"
            else:
                time_str = f"{int(time_diff.days)} days ago"
            
            recent_activities.append({
                'action': 'Property Listed',
                'user': listing.landlord.email,
                'time': time_str,
                'status': 'Pending Review' if not listing.verified else 'Active',
                'type': 'property'
            })
        
        # 3. Recent payments (last 5)
        if Payment:
            recent_payments = Payment.objects.select_related('payer').order_by('-created_at')[:5]
            
            for payment in recent_payments:
                time_diff = timezone.now() - payment.created_at
                if time_diff.total_seconds() < 3600:
                    time_str = f"{int(time_diff.total_seconds() / 60)} minutes ago"
                elif time_diff.total_seconds() < 86400:
                    time_str = f"{int(time_diff.total_seconds() / 3600)} hours ago"
                else:
                    time_str = f"{int(time_diff.days)} days ago"
                
                recent_activities.append({
                    'action': 'Payment Processed',
                    'user': payment.payer.email,
                    'time': time_str,
                    'status': payment.status.capitalize(),
                    'type': 'payment'
                })
        
        # 4. Admin activity logs (last 5)
        admin_logs = AdminActivityLog.objects.select_related('admin').order_by('-created_at')[:5]
        
        for log in admin_logs:
            time_diff = timezone.now() - log.created_at
            if time_diff.total_seconds() < 3600:
                time_str = f"{int(time_diff.total_seconds() / 60)} minutes ago"
            elif time_diff.total_seconds() < 86400:
                time_str = f"{int(time_diff.total_seconds() / 3600)} hours ago"
            else:
                time_str = f"{int(time_diff.days)} days ago"
            
            recent_activities.append({
                'action': log.get_action_display(),
                'user': log.admin.email,
                'time': time_str,
                'status': 'Completed',
                'type': 'admin'
            })
        
        # Sort all activities by time (most recent first) and limit to 10
        # Since we can't sort mixed datetime objects easily, we'll just take the first 10
        recent_activities = recent_activities[:10]
        
        return Response({
            'stats': stats,
            'alerts': alerts,
            'recentActivities': recent_activities
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users
    """
    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role', None)
        
        if role and role != 'all':
            queryset = queryset.filter(role=role)
        
        return queryset
    
    def get_serializer_context(self):
        """Pass request context to serializer for absolute URLs"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=True, methods=['post'])
    def update_role(self, request, pk=None):
        """Update user role"""
        user = self.get_object()
        new_role = request.data.get('role')
        
        if new_role not in dict(User.ROLE_CHOICES):
            return Response(
                {'error': 'Invalid role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_role = user.role
        user.role = new_role
        user.save()
        
        # Log the action
        log_admin_action(
            admin=request.user,
            action='user_role_change',
            target_model='User',
            target_id=user.id,
            description=f'Changed role from {old_role} to {new_role}',
            ip_address=get_client_ip(request)
        )
        
        return Response(UserManagementSerializer(user, context={'request': request}).data)
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Toggle user active status"""
        user = self.get_object()
        new_status = request.data.get('is_active')
        
        user.is_active = new_status
        user.save()
        
        # Log the action
        log_admin_action(
            admin=request.user,
            action='user_status_change',
            target_model='User',
            target_id=user.id,
            description=f'Changed active status to {new_status}',
            ip_address=get_client_ip(request)
        )
        
        return Response(UserManagementSerializer(user, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def property_management_list(request):
    """
    Get list of properties for admin management
    """
    try:
        from listings.models import Listing
        from django.conf import settings
        
        status_filter = request.query_params.get('status', 'all')
        queryset = Listing.objects.all().select_related('landlord').order_by('-created_at')
        
        if status_filter != 'all':
            if status_filter == 'pending':
                queryset = queryset.filter(verified=False)
            else:
                queryset = queryset.filter(status=status_filter)
        
        # Serialize the data
        properties = []
        for listing in queryset:
            # Handle images field (it's a JSON array in the model)
            images = listing.images if listing.images else []
            
            # Convert relative URLs to absolute URLs
            absolute_images = []
            for img in images:
                if img:
                    # If it's already an absolute URL, keep it
                    if img.startswith('http://') or img.startswith('https://'):
                        absolute_images.append(img)
                    # If it starts with /media/, build absolute URL
                    elif img.startswith('/media/'):
                        absolute_images.append(request.build_absolute_uri(img))
                    # If it's just a filename, assume it's in media
                    else:
                        absolute_images.append(request.build_absolute_uri(f'/media/{img}'))
            
            properties.append({
                'id': listing.id,
                'title': listing.title,
                'address': listing.address,
                'price': float(listing.price),
                'images': absolute_images,
                'verified': getattr(listing, 'verified', False),
                'status': listing.status,
                'created_at': listing.created_at.isoformat(),
                'landlord': {
                    'id': listing.landlord.id,
                    'name': f"{listing.landlord.first_name} {listing.landlord.last_name}".strip() or listing.landlord.email.split('@')[0],
                    'email': listing.landlord.email
                }
            })
        
        return Response(properties)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def property_update_status(request, property_id):
    """Update property status"""
    try:
        from listings.models import Listing
        
        listing = Listing.objects.get(id=property_id)
        new_status = request.data.get('status')
        
        old_status = listing.status
        listing.status = new_status
        listing.save()
        
        # Log the action
        log_admin_action(
            admin=request.user,
            action='property_update',
            target_model='Listing',
            target_id=listing.id,
            description=f'Changed status from {old_status} to {new_status}',
            ip_address=get_client_ip(request)
        )
        
        return Response({'message': 'Property status updated successfully'})
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def property_toggle_verification(request, property_id):
    """Toggle property verification status"""
    try:
        from listings.models import Listing
        
        listing = Listing.objects.get(id=property_id)
        new_verified = request.data.get('verified')
        
        # Add verified field if it doesn't exist
        if not hasattr(listing, 'verified'):
            # You may need to add this field to the Listing model
            pass
        else:
            listing.verified = new_verified
            listing.save()
        
        # Log the action
        log_admin_action(
            admin=request.user,
            action='property_verification',
            target_model='Listing',
            target_id=listing.id,
            description=f'Changed verification status to {new_verified}',
            ip_address=get_client_ip(request)
        )
        
        return Response({'message': 'Property verification updated successfully'})
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )



@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def application_management_list(request):
    """Get list of applications"""
    try:
        from django.apps import apps
        
        try:
            Application = apps.get_model('listings', 'Application')
        except LookupError:
            return Response([])
        
        status_filter = request.query_params.get('status', 'all')
        queryset = Application.objects.all().select_related('student', 'listing', 'listing__landlord').order_by('-created_at')
        
        if status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        applications = []
        for app in queryset:
            student_profile = None
            if hasattr(app.student, 'student'):
                student_profile = app.student.student
            
            applications.append({
                'id': app.id,
                'status': app.status,
                'message': getattr(app, 'message', ''),
                'created_at': app.created_at.isoformat(),
                'student': {
                    'id': app.student.id,
                    'name': f"{app.student.first_name} {app.student.last_name}".strip() or app.student.email.split('@')[0],
                    'email': app.student.email,
                    'avatar': None,
                    'university': student_profile.university if student_profile else 'N/A'
                },
                'listing': {
                    'id': app.listing.id,
                    'title': app.listing.title,
                    'landlord': {
                        'id': app.listing.landlord.id,
                        'name': f"{app.listing.landlord.first_name} {app.listing.landlord.last_name}".strip() or app.listing.landlord.email.split('@')[0]
                    }
                }
            })
        
        return Response(applications)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def application_update(request, application_id):
    """Update application status"""
    try:
        from django.apps import apps
        
        Application = apps.get_model('listings', 'Application')
        application = Application.objects.get(id=application_id)
        
        action = request.data.get('action')
        reason = request.data.get('reason', '')
        
        if action == 'approve':
            application.status = 'approved'
        elif action == 'reject':
            application.status = 'rejected'
        else:
            return Response(
                {'error': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.save()
        
        # Log the action
        log_admin_action(
            admin=request.user,
            action='application_action',
            target_model='Application',
            target_id=application.id,
            description=f'Application {action}ed',
            metadata={'reason': reason},
            ip_address=get_client_ip(request)
        )
        
        return Response({'message': f'Application {action}ed successfully'})
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def payment_management_list(request):
    """Get list of payments"""
    try:
        from django.apps import apps
        
        try:
            Payment = apps.get_model('payments', 'Payment')
        except LookupError:
            return Response([])
        
        status_filter = request.query_params.get('status', 'all')
        date_range = request.query_params.get('range', 'month')
        
        # Use correct field names: payer, payee, listing
        queryset = Payment.objects.all().select_related('payer', 'payee', 'listing', 'listing__landlord').order_by('-created_at')
        
        # Apply status filter
        if status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        # Apply date range filter
        now = timezone.now()
        if date_range == 'month':
            start_date = now - timedelta(days=30)
        elif date_range == 'quarter':
            start_date = now - timedelta(days=90)
        elif date_range == 'year':
            start_date = now - timedelta(days=365)
        else:
            start_date = None
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        
        payments = []
        for payment in queryset:
            # Build payment data with proper null checks
            payment_data = {
                'id': payment.id,
                'amount': float(payment.amount),
                'status': payment.status,
                'payment_type': payment.payment_type,
                'created_at': payment.created_at.isoformat(),
                'student': {
                    'id': payment.payer.id,
                    'name': f"{payment.payer.first_name} {payment.payer.last_name}".strip() or payment.payer.email.split('@')[0]
                }
            }
            
            # Add listing info if available
            if payment.listing:
                payment_data['listing'] = {
                    'id': payment.listing.id,
                    'title': payment.listing.title,
                    'landlord': {
                        'id': payment.listing.landlord.id,
                        'name': f"{payment.listing.landlord.first_name} {payment.listing.landlord.last_name}".strip() or payment.listing.landlord.email.split('@')[0]
                    }
                }
            else:
                payment_data['listing'] = None
            
            payments.append(payment_data)
        
        return Response(payments)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def payment_action(request, payment_id, action):
    """Approve or reject payment"""
    try:
        from django.apps import apps
        
        Payment = apps.get_model('payments', 'Payment')
        payment = Payment.objects.get(id=payment_id)
        
        if action == 'approve':
            payment.status = 'completed'
        elif action == 'reject':
            payment.status = 'failed'
        else:
            return Response(
                {'error': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment.save()
        
        # Log the action
        log_admin_action(
            admin=request.user,
            action='payment_action',
            target_model='Payment',
            target_id=payment.id,
            description=f'Payment {action}ed',
            ip_address=get_client_ip(request)
        )
        
        return Response({'message': f'Payment {action}ed successfully'})
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def reports_analytics(request):
    """Get analytics and reports data"""
    try:
        from listings.models import Listing
        from django.apps import apps
        
        date_range = request.query_params.get('range', 'month')
        
        # Calculate date range
        now = timezone.now()
        if date_range == 'month':
            start_date = now - timedelta(days=30)
            months_back = 6
        elif date_range == 'quarter':
            start_date = now - timedelta(days=90)
            months_back = 12
        elif date_range == 'year':
            start_date = now - timedelta(days=365)
            months_back = 12
        else:
            start_date = now - timedelta(days=30)
            months_back = 6
        
        # User statistics
        user_stats = {
            'total': User.objects.count(),
            'students': User.objects.filter(role='student').count(),
            'landlords': User.objects.filter(role='landlord').count(),
            'agents': User.objects.filter(role='agent').count(),
            'admins': User.objects.filter(role='admin').count()
        }
        
        # Property statistics
        property_stats = {
            'total': Listing.objects.count(),
            'available': Listing.objects.filter(status='available').count(),
            'booked': Listing.objects.filter(status='booked').count(),
            'inactive': Listing.objects.filter(status='inactive').count()
        }
        
        # Revenue statistics
        revenue_monthly = []
        total_revenue = Decimal('0.00')
        
        try:
            Payment = apps.get_model('payments', 'Payment')
            
            # Calculate monthly revenue
            for i in range(months_back):
                month_start = now - timedelta(days=30 * (i + 1))
                month_end = now - timedelta(days=30 * i)
                
                month_revenue = Payment.objects.filter(
                    status='completed',
                    created_at__gte=month_start,
                    created_at__lt=month_end
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
                
                revenue_monthly.insert(0, {
                    'month': month_start.strftime('%b %Y'),
                    'amount': float(month_revenue)
                })
            
            # Total revenue
            total_revenue = Payment.objects.filter(
                status='completed',
                created_at__gte=start_date
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        except LookupError:
            pass
        
        revenue_stats = {
            'total': float(total_revenue),
            'monthly': revenue_monthly,
            'yearly': float(total_revenue)
        }
        
        # Application statistics
        application_stats = {
            'total': 0,
            'pending': 0,
            'approved': 0,
            'rejected': 0
        }
        
        try:
            Application = apps.get_model('listings', 'Application')
            application_stats = {
                'total': Application.objects.count(),
                'pending': Application.objects.filter(status='pending').count(),
                'approved': Application.objects.filter(status='approved').count(),
                'rejected': Application.objects.filter(status='rejected').count()
            }
        except LookupError:
            pass
        
        return Response({
            'userStats': user_stats,
            'propertyStats': property_stats,
            'revenueStats': revenue_stats,
            'applicationStats': application_stats
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class SupportTicketViewSet(viewsets.ModelViewSet):
    """ViewSet for support ticket management"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SupportTicketListSerializer
        return SupportTicketSerializer
    
    def get_queryset(self):
        queryset = SupportTicket.objects.all().select_related('user').prefetch_related('messages')
        status_filter = self.request.query_params.get('status', None)
        
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update ticket status"""
        ticket = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(SupportTicket.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ticket.status = new_status
        ticket.save()
        
        # Log the action
        log_admin_action(
            admin=request.user,
            action='ticket_action',
            target_model='SupportTicket',
            target_id=ticket.id,
            description=f'Changed status to {new_status}',
            ip_address=get_client_ip(request)
        )
        
        return Response(SupportTicketSerializer(ticket).data)
    
    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        """Add a message to the ticket"""
        ticket = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response(
                {'error': 'Content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message = SupportMessage.objects.create(
            ticket=ticket,
            sender='admin',
            content=content
        )
        
        return Response(TicketMessageSerializer(message).data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated, IsAdminUser])
def platform_settings(request):
    """Get or update platform settings"""
    settings = PlatformSettings.load()
    
    if request.method == 'GET':
        serializer = PlatformSettingsSerializer(settings)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = PlatformSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            
            # Log the action
            log_admin_action(
                admin=request.user,
                action='settings_update',
                target_model='PlatformSettings',
                target_id=settings.id,
                description='Updated platform settings',
                metadata=request.data,
                ip_address=get_client_ip(request)
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Agent Dashboard Views
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAgent])
def agent_dashboard_overview(request):
    """Get agent dashboard overview statistics"""
    try:
        from listings.models import Listing
        from django.apps import apps
        
        # Get agent profile
        agent = request.user.agent
        
        # Calculate statistics
        students_assisted = 0  # This would come from support tickets or interactions
        landlords_onboarded = User.objects.filter(role='landlord', is_active=True).count()
        properties_verified = Listing.objects.filter(verified=True).count()
        active_disputes = 0  # This would come from dispute/support system
        
        stats = {
            'studentsAssisted': students_assisted,
            'landlordsOnboarded': landlords_onboarded,
            'propertiesVerified': properties_verified,
            'activeDisputes': active_disputes
        }
        
        # Mock tasks for now
        tasks = [
            {
                'title': 'Verify Property Documents',
                'description': 'Review and verify 3 pending property submissions',
                'actionLabel': 'Review Now',
                'icon': '📋'
            },
            {
                'title': 'Student Support Request',
                'description': 'Respond to urgent support ticket from John Doe',
                'actionLabel': 'Respond',
                'icon': '🎓'
            }
        ]
        
        # Mock pending verifications
        pending_verifications = [
            {
                'type': 'Property Verification',
                'details': 'Modern Studio Apartment - Boston',
                'time': '2 hours ago'
            },
            {
                'type': 'Landlord Verification',
                'details': 'Sarah Wilson - Document Review',
                'time': '4 hours ago'
            }
        ]
        
        return Response({
            'stats': stats,
            'tasks': tasks,
            'pendingVerifications': pending_verifications
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAgent])
def agent_applications_list(request):
    """Get list of applications for agent review"""
    try:
        from django.apps import apps
        
        try:
            Application = apps.get_model('listings', 'Application')
        except LookupError:
            return Response({'applications': []})
        
        applications = Application.objects.all().select_related(
            'student', 'listing', 'listing__landlord'
        ).order_by('-created_at')
        
        applications_data = []
        for app in applications:
            applications_data.append({
                'id': app.id,
                'applicant_name': f"{app.student.first_name} {app.student.last_name}".strip() or app.student.email.split('@')[0],
                'applicant_email': app.student.email,
                'property_title': app.listing.title,
                'property_address': app.listing.address,
                'status': app.status,
                'created_at': app.created_at.isoformat()
            })
        
        return Response({'applications': applications_data})
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAgent])
def agent_application_update(request, application_id):
    """Update application status"""
    try:
        from django.apps import apps
        
        Application = apps.get_model('listings', 'Application')
        application = Application.objects.get(id=application_id)
        
        new_status = request.data.get('status')
        if new_status in ['approved', 'rejected', 'under_review']:
            application.status = new_status
            application.save()
            
            return Response({'message': 'Application updated successfully'})
        else:
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAgent])
def agent_tasks_list(request):
    """Get list of tasks for agent"""
    try:
        # Mock tasks data - in a real implementation, this would come from a Task model
        tasks = [
            {
                'id': 1,
                'title': 'Review Property Verification',
                'description': 'Verify documents for Modern Studio Apartment',
                'status': 'pending',
                'priority': 'high',
                'due_date': '2024-01-25',
                'assigned_by': 'System',
                'task_type': 'Verification'
            },
            {
                'id': 2,
                'title': 'Student Support Follow-up',
                'description': 'Follow up with John Doe regarding booking issue',
                'status': 'in_progress',
                'priority': 'medium',
                'due_date': '2024-01-24',
                'assigned_by': 'Admin',
                'task_type': 'Support'
            },
            {
                'id': 3,
                'title': 'Landlord Onboarding',
                'description': 'Complete onboarding process for new landlord',
                'status': 'completed',
                'priority': 'low',
                'due_date': '2024-01-22',
                'assigned_by': 'System',
                'task_type': 'Onboarding'
            }
        ]
        
        return Response({'tasks': tasks})
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAgent])
def agent_task_update(request, task_id):
    """Update task status"""
    try:
        # Mock implementation - in real app, this would update a Task model
        new_status = request.data.get('status')
        
        if new_status in ['pending', 'in_progress', 'completed', 'cancelled']:
            return Response({'message': 'Task updated successfully'})
        else:
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAgent])
def agent_reports_data(request):
    """Get reports and analytics data for agent"""
    try:
        days = int(request.query_params.get('days', 30))
        
        # Mock metrics data
        metrics = {
            'studentsHelped': 25,
            'verificationsCompleted': 12,
            'applicationsProcessed': 18,
            'averageRating': '4.8',
            'avgResponseTime': '2.5 hours',
            'fastestResponse': '15 minutes',
            'resolutionRate': '94%',
            'tasksCompleted': 47,
            'onTimeCompletion': '89%',
            'overdueTasks': 2
        }
        
        # Mock activities
        activities = [
            {
                'title': 'Verified Property Documents',
                'description': 'Completed verification for Modern Studio Apartment',
                'icon': '✅',
                'timestamp': '2024-01-21T10:30:00Z'
            },
            {
                'title': 'Responded to Support Ticket',
                'description': 'Helped student with booking issue',
                'icon': '🎓',
                'timestamp': '2024-01-21T09:15:00Z'
            }
        ]
        
        return Response({
            'metrics': metrics,
            'activities': activities
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAgent])
def agent_reports_export(request):
    """Export agent reports"""
    try:
        format_type = request.query_params.get('format', 'pdf')
        days = request.query_params.get('days', '30')
        
        # Mock implementation - in real app, this would generate actual reports
        from django.http import HttpResponse
        
        if format_type == 'pdf':
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="agent-report-{days}days.pdf"'
            response.write(b'Mock PDF content')
        else:
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="agent-report-{days}days.csv"'
            response.write('Date,Activity,Status\n2024-01-21,Property Verified,Completed\n')
        
        return response
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
