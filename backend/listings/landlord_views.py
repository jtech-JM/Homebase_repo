from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Listing, Booking, MaintenanceRequest
from .serializers import ListingSerializer
from users.permissions import IsLandlord


class LandlordReportsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsLandlord]

    @action(detail=False, methods=['get'])
    def reports(self, request):
        """
        Get landlord reports and analytics
        Query params: range (month, quarter, year)
        """
        date_range = request.query_params.get('range', 'month')

        # Calculate date range
        now = timezone.now()
        if date_range == 'month':
            start_date = now.replace(day=1)
        elif date_range == 'quarter':
            quarter = (now.month - 1) // 3 + 1
            start_date = now.replace(month=(quarter-1)*3 + 1, day=1)
        elif date_range == 'year':
            start_date = now.replace(month=1, day=1)
        else:
            start_date = now.replace(day=1)

        # Get landlord's listings
        landlord_listings = Listing.objects.filter(landlord=request.user)

        # Calculate occupancy rate
        total_listings = landlord_listings.count()
        active_bookings = Booking.objects.filter(
            listing__landlord=request.user,
            status__in=['active', 'confirmed'],
            start_date__lte=now.date(),
            end_date__gte=now.date()
        ).count()
        occupancy_rate = (active_bookings / total_listings * 100) if total_listings > 0 else 0

        # Calculate revenue
        monthly_revenue = Booking.objects.filter(
            listing__landlord=request.user,
            status__in=['active', 'completed'],
            start_date__gte=start_date
        ).aggregate(total=Sum('monthly_rent'))['total'] or 0

        yearly_revenue = Booking.objects.filter(
            listing__landlord=request.user,
            status__in=['active', 'completed'],
            start_date__gte=now.replace(month=1, day=1)
        ).aggregate(total=Sum('monthly_rent'))['total'] or 0

        # Maintenance stats
        maintenance_stats = MaintenanceRequest.objects.filter(
            listing__landlord=request.user
        ).aggregate(
            pending=Count('id', filter=Q(status='pending')),
            completed=Count('id', filter=Q(status='completed'))
        )

        # Monthly stats for chart (last 12 months)
        monthly_stats = []
        for i in range(12):
            month_date = now - timedelta(days=30*i)
            month_start = month_date.replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

            revenue = Booking.objects.filter(
                listing__landlord=request.user,
                status__in=['active', 'completed'],
                start_date__gte=month_start,
                start_date__lte=month_end
            ).aggregate(total=Sum('monthly_rent'))['total'] or 0

            monthly_stats.append({
                'month': month_start.strftime('%b %Y'),
                'amount': float(revenue)
            })

        monthly_stats.reverse()  # Most recent first

        data = {
            'occupancyRate': round(occupancy_rate, 1),
            'revenue': {
                'monthly': float(monthly_revenue),
                'yearly': float(yearly_revenue),
            },
            'maintenance': {
                'pending': maintenance_stats['pending'],
                'completed': maintenance_stats['completed'],
            },
            'monthlyStats': monthly_stats,
        }

        return Response(data)
