from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Booking, Listing
from .serializers import BookingSerializer
from users.permissions import IsLandlord


class TenantViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for landlords to view their tenants
    """
    serializer_class = BookingSerializer
    permission_classes = [IsLandlord]

    def get_queryset(self):
        """
        Return active and past tenants for the landlord
        """
        return Booking.objects.filter(
            Q(listing__landlord=self.request.user) &
            Q(status__in=['active', 'completed'])
        ).select_related('student', 'listing').order_by('-created_at')

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get tenant statistics for the landlord
        """
        active_tenants = self.get_queryset().filter(status='active').count()
        total_tenants = self.get_queryset().count()

        return Response({
            'active_tenants': active_tenants,
            'total_tenants': total_tenants,
        })

    def list(self, request, *args, **kwargs):
        """
        List tenants with formatted data for frontend
        """
        queryset = self.get_queryset()
        status_filter = request.query_params.get('status', 'all')

        if status_filter != 'all':
            queryset = queryset.filter(status=status_filter)

        tenants_data = []
        for booking in queryset:
            tenant_data = {
                'id': booking.student.id,
                'name': booking.student.get_full_name() or booking.student.email,
                'email': booking.student.email,
                'status': booking.status,
                'property': {
                    'id': booking.listing.id,
                    'title': booking.listing.title,
                    'address': booking.listing.address,
                },
                'leaseStart': booking.start_date.isoformat(),
                'leaseEnd': booking.end_date.isoformat(),
                'monthly_rent': str(booking.monthly_rent),
                'booking_id': booking.id,
            }
            tenants_data.append(tenant_data)

        return Response(tenants_data)

    @action(detail=True, methods=['put'])
    def status(self, request, pk=None):
        """
        Update tenant status (end lease)
        """
        try:
            booking = Booking.objects.get(
                id=pk,
                listing__landlord=request.user,
                status='active'
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Active booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # End the lease
        booking.status = 'completed'
        booking.save()

        # Make the listing available again
        booking.listing.status = 'available'
        booking.listing.save()

        return Response({
            'message': 'Lease ended successfully',
            'booking_id': booking.id,
            'status': booking.status
        })
