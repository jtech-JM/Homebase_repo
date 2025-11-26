from rest_framework import viewsets, permissions, status, filters, serializers, parsers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import JSONParser
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Avg, Sum
from django.utils import timezone
from django.utils.timesince import timesince
from .models import Listing, Booking, MaintenanceRequest, PropertyDocument
from payments.models import Payment
from .serializers import (
    ListingSerializer, BookingSerializer, MaintenanceRequestSerializer,
    PropertyDocumentSerializer
)
from .access_control_views import ListingAccessControlMixin


class IsLandlordOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'landlord'


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.uploaded_by == request.user


class ListingViewSet(ListingAccessControlMixin, viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    permission_classes = [IsLandlordOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'address']
    ordering_fields = ['created_at', 'price', 'status']
    ordering = ['-created_at']
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'admin':
                return Listing.objects.all()
            elif user.role == 'landlord':
                return Listing.objects.filter(landlord=user)
        return Listing.objects.filter(status='available')

    def perform_create(self, serializer):
        serializer.save(landlord=self.request.user)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        if not request.user.is_authenticated or request.user.role != 'landlord':
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        listings = Listing.objects.filter(landlord=request.user)
        total_listings = listings.count()
        available_listings = listings.filter(status='available').count()
        bookings = Booking.objects.filter(listing__landlord=request.user)
        total_bookings = bookings.count()
        maintenance_requests = MaintenanceRequest.objects.filter(
            listing__landlord=request.user,
            status='pending'
        ).count()

        return Response({
            'total_listings': total_listings,
            'available_listings': available_listings,
            'total_bookings': total_bookings,
            'pending_maintenance': maintenance_requests,
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        if not request.user.is_authenticated or request.user.role != 'landlord':
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        listings = Listing.objects.filter(landlord=request.user)
        active_listings = listings.filter(status='available').count()
        total_income = Payment.objects.filter(payee=request.user, status='completed').aggregate(total=Sum('amount'))['total'] or 0
        booked_listings = listings.filter(status='booked').count()
        occupancy_rate = (booked_listings / listings.count()) * 100 if listings.count() > 0 else 0
        pending_applications = Booking.objects.filter(listing__landlord=request.user, status='pending').count()

        return Response({
            'activeListings': active_listings,
            'totalIncome': total_income,
            'occupancyRate': round(occupancy_rate, 2),
            'pendingApplications': pending_applications,
        })

    @action(detail=False, methods=['get'])
    def applications(self, request):
        if not request.user.is_authenticated or request.user.role != 'landlord':
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        bookings = Booking.objects.filter(listing__landlord=request.user).select_related('student', 'listing')
        data = []
        for booking in bookings:
            data.append({
                'id': booking.id,
                'student': {
                    'name': booking.student.get_full_name() or booking.student.email,
                    'email': booking.student.email,
                    'university': getattr(booking.student, 'university', ''),
                    'avatar': getattr(booking.student, 'avatar', None),
                },
                'listing': {
                    'title': booking.listing.title,
                    'address': booking.listing.address,
                },
                'status': booking.status,
                'created_at': booking.created_at,
                'message': booking.notes,
            })
        return Response(data)

    @action(detail=False, methods=['patch'], url_path='applications/(?P<application_id>\d+)')
    def update_application(self, request, application_id=None):
        if not request.user.is_authenticated or request.user.role != 'landlord':
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            booking = Booking.objects.get(
                id=application_id,
                listing__landlord=request.user
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Application not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        action = request.data.get('action')
        reason = request.data.get('reason', '')

        if action == 'approve':
            booking.status = 'approved'
        elif action == 'reject':
            booking.status = 'rejected'
            booking.notes = reason
        else:
            return Response(
                {'error': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.save()
        return Response({
            'id': booking.id,
            'status': booking.status,
            'message': 'Application updated successfully'
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def featured(self, request):
        """
        Get featured listings for homepage display
        """
        featured_listings = Listing.objects.filter(
            status='available',
            featured=True
        ).order_by('-created_at')[:6]  # Get up to 6 featured listings

        if not featured_listings.exists():
            # If no featured listings, return recent available listings
            featured_listings = Listing.objects.filter(
                status='available'
            ).order_by('-created_at')[:6]

        serializer = self.get_serializer(featured_listings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def popular(self, request):
        """
        Get popular/trending listings based on booking count
        """
        from django.db.models import Count

        popular_listings = Listing.objects.filter(
            status='available'
        ).annotate(
            booking_count=Count('bookings')
        ).order_by('-booking_count', '-created_at')[:10]  # Top 10 popular listings

        serializer = self.get_serializer(popular_listings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def search(self, request):
        """
        Search listings with filters
        """
        query = request.data.get('query', '')
        location = request.data.get('location', '')
        min_price = request.data.get('min_price')
        max_price = request.data.get('max_price')
        property_type = request.data.get('property_type')
        amenities = request.data.get('amenities', [])

        queryset = Listing.objects.filter(status='available')

        # Text search in title, description, address
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(address__icontains=query)
            )

        # Location filter
        if location:
            queryset = queryset.filter(
                Q(address__icontains=location) 

            )

        # Price range filter
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Property type filter
        if property_type:
            queryset = queryset.filter(property_type=property_type)

        # Amenities filter (if amenities field exists)
        if amenities:
            for amenity in amenities:
                queryset = queryset.filter(amenities__icontains=amenity)

        # Order by relevance (newest first for now)
        queryset = queryset.order_by('-created_at')

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        listing = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Listing.LISTING_STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        listing.status = new_status
        listing.save()
        return Response(ListingSerializer(listing).data)

    @action(detail=False, methods=['get'], url_path='student/applications')
    def student_applications(self, request):
        """
        Get applications for the current student user
        """
        if not request.user.is_authenticated or request.user.role != 'student':
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        bookings = Booking.objects.filter(student=request.user).select_related('listing')
        data = []
        for booking in bookings:
            image_url = None
            if booking.listing.images:
                image_url = request.build_absolute_uri(booking.listing.images[0])

            data.append({
                'id': booking.id,
                'property': {
                    'title': booking.listing.title,
                    'address': booking.listing.address,
                    'image': image_url,
                    'monthlyRent': str(booking.monthly_rent),
                },
                'status': booking.status,
                'createdAt': booking.created_at.isoformat(),
            })
        return Response(data)


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'start_date', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Booking.objects.all()
        elif user.role == 'landlord':
            return Booking.objects.filter(listing__landlord=user)
        return Booking.objects.filter(student=user)

    def perform_create(self, serializer):
        from verification.access_control import access_control_engine
        
        listing = Listing.objects.get(pk=self.request.data['listing'])
        if listing.status != 'available':
            raise serializers.ValidationError(
                'This property is not available for booking'
            )

        # Check verification requirement for student housing
        required_score = listing.get_verification_required_score()
        if required_score > 0:
            decision = access_control_engine.evaluate_access(
                self.request.user,
                'booking_student_housing',
                required_score=required_score
            )
            
            if not decision.granted:
                raise serializers.ValidationError({
                    'verification_required': True,
                    'message': 'Insufficient verification for student housing',
                    'required_score': required_score,
                    'current_score': decision.verification_score,
                    'reason': decision.blocking_reason
                })

        # Example security deposit calculation
        security_deposit = listing.price * 2
        serializer.save(
            student=self.request.user,
            monthly_rent=listing.price,
            security_deposit=security_deposit
        )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        booking = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Booking.BOOKING_STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update listing status based on booking status
        if new_status == 'active':
            booking.listing.status = 'booked'
            booking.listing.save()
        elif (new_status in ['completed', 'cancelled'] and
              booking.status == 'active'):
            booking.listing.status = 'available'
            booking.listing.save()

        booking.status = new_status
        booking.save()
        return Response(BookingSerializer(booking).data)


class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = []
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'priority', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            queryset = MaintenanceRequest.objects.all()
        elif user.role == 'landlord':
            queryset = MaintenanceRequest.objects.filter(listing__landlord=user)
        else:
            queryset = MaintenanceRequest.objects.filter(tenant=user)

        # Handle 'all' status filter
        status = self.request.query_params.get('status')
        if status and status != 'all':
            queryset = queryset.filter(status=status)

        return queryset

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        maintenance_request = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(MaintenanceRequest.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status == 'completed':
            maintenance_request.completed_date = timezone.now()

        maintenance_request.status = new_status
        maintenance_request.save()
        return Response(MaintenanceRequestSerializer(maintenance_request).data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        if request.user.role not in ['landlord', 'admin']:
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        queryset = MaintenanceRequest.objects.filter(
            listing__landlord=request.user
        )
        completed_requests = queryset.filter(completed_date__isnull=False)
        avg_time = completed_requests.aggregate(
            avg_time=Avg('completed_date' - 'created_at')
        )['avg_time']

        return Response({
            'total_requests': queryset.count(),
            'pending_requests': queryset.filter(status='pending').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'completed': queryset.filter(status='completed').count(),
            'avg_completion_time': avg_time,
            'by_priority': {
                priority: queryset.filter(priority=priority).count()
                for priority, _ in MaintenanceRequest.PRIORITY_CHOICES
            }
        })


class PropertyDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = PropertyDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'document_type']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return PropertyDocument.objects.all()
        elif user.role == 'landlord':
            return PropertyDocument.objects.filter(listing__landlord=user)
        return PropertyDocument.objects.filter(
            Q(listing__tenant=user) | Q(uploaded_by=user)
        )

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
