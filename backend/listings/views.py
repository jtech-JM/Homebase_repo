from rest_framework import viewsets, permissions, status, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Avg
from django.utils import timezone
from .models import Listing, Booking, MaintenanceRequest, PropertyDocument
from .serializers import (
    ListingSerializer, BookingSerializer, MaintenanceRequestSerializer,
    PropertyDocumentSerializer
)


class IsLandlordOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == 'landlord'


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.uploaded_by == request.user


class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    permission_classes = [permissions.IsAuthenticated, IsLandlordOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'address']
    ordering_fields = ['created_at', 'price', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Listing.objects.all()
        elif user.role == 'landlord':
            return Listing.objects.filter(landlord=user)
        return Listing.objects.filter(status='available')

    def perform_create(self, serializer):
        serializer.save(landlord=self.request.user)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        if request.user.role != 'landlord':
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
        listing = Listing.objects.get(pk=self.request.data['listing'])
        if listing.status != 'available':
            raise serializers.ValidationError(
                'This property is not available for booking'
            )
        
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
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'priority', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return MaintenanceRequest.objects.all()
        elif user.role == 'landlord':
            return MaintenanceRequest.objects.filter(listing__landlord=user)
        return MaintenanceRequest.objects.filter(tenant=user)

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
