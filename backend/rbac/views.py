from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from users.models import User
from listings.models import Listing, Booking
from payments.models import Payment
from verification.models import Verification
from .models import Role, UserRole
from .serializers import RoleSerializer, UserRoleSerializer

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAdminUser]

class UserRoleViewSet(viewsets.ModelViewSet):
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminDashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get admin dashboard statistics"""
        # User statistics
        total_students = User.objects.filter(role='student').count()
        total_landlords = User.objects.filter(role='landlord').count()
        total_agents = User.objects.filter(role='agent').count()
        total_admins = User.objects.filter(role='admin').count()

        # Listing statistics
        active_listings = Listing.objects.filter(status='available').count()
        total_listings = Listing.objects.count()

        # Booking statistics
        pending_applications = Booking.objects.filter(status='pending').count()
        active_bookings = Booking.objects.filter(status='active').count()

        # Payment statistics (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_payments = Payment.objects.filter(created_at__gte=thirty_days_ago)
        monthly_revenue = sum(payment.amount for payment in recent_payments if payment.status == 'completed')

        # Verification statistics
        pending_verifications = Verification.objects.filter(status='pending').count()

        # Recent activity (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_users = User.objects.filter(date_joined__gte=seven_days_ago).count()
        recent_listings = Listing.objects.filter(created_at__gte=seven_days_ago).count()
        recent_bookings = Booking.objects.filter(created_at__gte=seven_days_ago).count()

        stats = {
            'totalStudents': total_students,
            'totalLandlords': total_landlords,
            'totalAgents': total_agents,
            'totalAdmins': total_admins,
            'activeListings': active_listings,
            'totalListings': total_listings,
            'pendingApplications': pending_applications,
            'activeBookings': active_bookings,
            'monthlyRevenue': float(monthly_revenue),
            'pendingVerifications': pending_verifications,
        }

        alerts = []

        # Generate alerts based on thresholds
        if pending_verifications > 10:
            alerts.append({
                'title': 'High Pending Verifications',
                'description': f'{pending_verifications} users awaiting verification',
                'time': 'Now',
                'type': 'warning'
            })

        if pending_applications > 20:
            alerts.append({
                'title': 'High Pending Applications',
                'description': f'{pending_applications} booking applications need review',
                'time': 'Now',
                'type': 'warning'
            })

        if active_listings < 50:
            alerts.append({
                'title': 'Low Active Listings',
                'description': f'Only {active_listings} active listings available',
                'time': 'Now',
                'type': 'info'
            })

        return Response({
            'stats': stats,
            'alerts': alerts,
            'recentActivity': {
                'newUsers': recent_users,
                'newListings': recent_listings,
                'newBookings': recent_bookings,
            }
        })

    @action(detail=False, methods=['get'])
    def users(self, request):
        """Get paginated list of all users with filters"""
        role = request.query_params.get('role')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))

        users = User.objects.all().order_by('-date_joined')

        if role:
            users = users.filter(role=role)
        if search:
            users = users.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        total = users.count()
        start = (page - 1) * limit
        end = start + limit
        users_page = users[start:end]

        user_data = []
        for user in users_page:
            user_data.append({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'phone': user.phone,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
            })

        return Response({
            'users': user_data,
            'total': total,
            'page': page,
            'pages': (total + limit - 1) // limit
        })

    @action(detail=False, methods=['get'])
    def properties(self, request):
        """Get paginated list of all properties with filters"""
        status = request.query_params.get('status')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))

        listings = Listing.objects.all().select_related('landlord').order_by('-created_at')

        if status:
            listings = listings.filter(status=status)
        if search:
            listings = listings.filter(
                Q(title__icontains=search) |
                Q(address__icontains=search) |
                Q(landlord__email__icontains=search)
            )

        total = listings.count()
        start = (page - 1) * limit
        end = start + limit
        listings_page = listings[start:end]

        listing_data = []
        for listing in listings_page:
            listing_data.append({
                'id': listing.id,
                'title': listing.title,
                'address': listing.address,
                'price': float(listing.price),
                'status': listing.status,
                'property_type': listing.property_type,
                'bedrooms': listing.bedrooms,
                'bathrooms': float(listing.bathrooms),
                'landlord': {
                    'id': listing.landlord.id,
                    'email': listing.landlord.email,
                    'name': f"{listing.landlord.first_name} {listing.landlord.last_name}".strip()
                },
                'created_at': listing.created_at,
                'verified': listing.verified,
            })

        return Response({
            'properties': listing_data,
            'total': total,
            'page': page,
            'pages': (total + limit - 1) // limit
        })

    @action(detail=False, methods=['get'])
    def applications(self, request):
        """Get paginated list of all booking applications"""
        status = request.query_params.get('status')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))

        bookings = Booking.objects.all().select_related('student', 'listing__landlord').order_by('-created_at')

        if status:
            bookings = bookings.filter(status=status)

        total = bookings.count()
        start = (page - 1) * limit
        end = start + limit
        bookings_page = bookings[start:end]

        booking_data = []
        for booking in bookings_page:
            booking_data.append({
                'id': booking.id,
                'student': {
                    'id': booking.student.id,
                    'email': booking.student.email,
                    'name': f"{booking.student.first_name} {booking.student.last_name}".strip()
                },
                'listing': {
                    'id': booking.listing.id,
                    'title': booking.listing.title,
                    'address': booking.listing.address,
                    'landlord': {
                        'id': booking.listing.landlord.id,
                        'email': booking.listing.landlord.email,
                        'name': f"{booking.listing.landlord.first_name} {booking.listing.landlord.last_name}".strip()
                    }
                },
                'status': booking.status,
                'start_date': booking.start_date,
                'end_date': booking.end_date,
                'monthly_rent': float(booking.monthly_rent),
                'created_at': booking.created_at,
            })

        return Response({
            'applications': booking_data,
            'total': total,
            'page': page,
            'pages': (total + limit - 1) // limit
        })

    @action(detail=False, methods=['get'])
    def payments(self, request):
        """Get paginated list of all payments"""
        status = request.query_params.get('status')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))

        payments = Payment.objects.all().select_related('booking__student', 'booking__listing').order_by('-created_at')

        if status:
            payments = payments.filter(status=status)

        total = payments.count()
        start = (page - 1) * limit
        end = start + limit
        payments_page = payments[start:end]

        payment_data = []
        for payment in payments_page:
            payment_data.append({
                'id': payment.id,
                'booking': {
                    'id': payment.booking.id,
                    'student': {
                        'id': payment.booking.student.id,
                        'email': payment.booking.student.email,
                        'name': f"{payment.booking.student.first_name} {payment.booking.student.last_name}".strip()
                    },
                    'listing': {
                        'id': payment.booking.listing.id,
                        'title': payment.booking.listing.title,
                    }
                },
                'amount': float(payment.amount),
                'status': payment.status,
                'payment_method': payment.payment_method,
                'transaction_id': payment.transaction_id,
                'created_at': payment.created_at,
            })

        return Response({
            'payments': payment_data,
            'total': total,
            'page': page,
            'pages': (total + limit - 1) // limit
        })

    @action(detail=False, methods=['get'])
    def reports(self, request):
        """Get comprehensive platform reports"""
        # User growth over time (last 12 months)
        user_growth = []
        for i in range(12):
            date = timezone.now() - timedelta(days=30*i)
            month_start = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

            count = User.objects.filter(date_joined__range=(month_start, month_end)).count()
            user_growth.append({
                'month': month_start.strftime('%Y-%m'),
                'count': count
            })

        # Revenue by month (last 12 months)
        revenue_data = []
        for i in range(12):
            date = timezone.now() - timedelta(days=30*i)
            month_start = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

            monthly_payments = Payment.objects.filter(
                created_at__range=(month_start, month_end),
                status='completed'
            )
            revenue = sum(float(payment.amount) for payment in monthly_payments)
            revenue_data.append({
                'month': month_start.strftime('%Y-%m'),
                'revenue': revenue
            })

        # Property type distribution
        property_types = Listing.objects.values('property_type').annotate(
            count=Count('property_type')
        ).order_by('-count')

        # Booking status distribution
        booking_statuses = Booking.objects.values('status').annotate(
            count=Count('status')
        ).order_by('-count')

        return Response({
            'userGrowth': user_growth,
            'revenue': revenue_data,
            'propertyTypes': list(property_types),
            'bookingStatuses': list(booking_statuses),
        })
