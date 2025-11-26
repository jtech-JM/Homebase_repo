"""API views for verification renewal and expiration."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from .renewal_services import renewal_service
from .renewal_models import VerificationRenewalRequest, VerificationExpiration


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_expiration_status(request):
    """Get current user's verification expiration status."""
    expiration_status = renewal_service.get_expiration_status(request.user)
    penalties = renewal_service.apply_expiration_penalties(request.user)
    
    return Response({
        **expiration_status,
        'penalties': penalties,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_renewal(request):
    """Request verification renewal."""
    renewal_type = request.data.get('renewal_type', 'full')
    documents = request.data.get('documents', [])
    
    # Check if user already has pending renewal
    existing = VerificationRenewalRequest.objects.filter(
        user=request.user,
        status='pending'
    ).first()
    
    if existing:
        return Response({
            'error': 'You already have a pending renewal request',
            'renewal_id': existing.id,
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create renewal request
    renewal = renewal_service.create_renewal_request(
        request.user,
        renewal_type,
        documents
    )
    
    return Response({
        'success': True,
        'message': 'Renewal request submitted',
        'renewal_id': renewal.id,
        'status': renewal.status,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_renewal_requests(request):
    """Get user's renewal requests."""
    renewals = VerificationRenewalRequest.objects.filter(
        user=request.user
    ).order_by('-created_at')
    
    data = [{
        'id': r.id,
        'renewal_type': r.renewal_type,
        'status': r.status,
        'created_at': r.created_at.isoformat(),
        'reviewed_at': r.reviewed_at.isoformat() if r.reviewed_at else None,
        'review_notes': r.review_notes,
    } for r in renewals]
    
    return Response({
        'renewals': data,
        'count': len(data),
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def process_renewal_request(request, renewal_id):
    """Process a renewal request (admin only)."""
    approve = request.data.get('approve', False)
    notes = request.data.get('notes', '')
    
    result = renewal_service.process_renewal(
        renewal_id,
        approve=approve,
        reviewer=request.user,
        notes=notes
    )
    
    if result['success']:
        return Response(result)
    else:
        return Response(result, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_renewals(request):
    """Get all pending renewal requests (admin only)."""
    renewals = VerificationRenewalRequest.objects.filter(
        status='pending'
    ).select_related('user').order_by('-created_at')
    
    data = [{
        'id': r.id,
        'user': {
            'id': r.user.id,
            'email': r.user.email,
            'name': r.user.get_full_name() if hasattr(r.user, 'get_full_name') else r.user.email,
        },
        'renewal_type': r.renewal_type,
        'created_at': r.created_at.isoformat(),
        'documents_count': len(r.documents_submitted),
    } for r in renewals]
    
    return Response({
        'renewals': data,
        'count': len(data),
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def check_all_expirations(request):
    """Manually trigger expiration check (admin only)."""
    results = renewal_service.check_all_expirations()
    
    return Response({
        'success': True,
        'message': 'Expiration check completed',
        'results': results,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def expiration_statistics(request):
    """Get expiration statistics (admin only)."""
    expirations = VerificationExpiration.objects.all()
    
    stats = {
        'total': expirations.count(),
        'active': expirations.filter(status='active').count(),
        'expiring_soon': expirations.filter(status='expiring_soon').count(),
        'expired': expirations.filter(status='expired').count(),
        'in_grace_period': expirations.filter(in_grace_period=True).count(),
    }
    
    # Get users expiring in next 30 days
    expiring_soon = expirations.filter(status='expiring_soon').select_related('user')
    
    expiring_users = [{
        'user_id': e.user.id,
        'email': e.user.email,
        'expires_at': e.expires_at.isoformat() if e.expires_at else None,
        'days_until': (e.expires_at - timezone.now()).days if e.expires_at else None,
    } for e in expiring_soon[:10]]  # Limit to 10 for performance
    
    return Response({
        'statistics': stats,
        'expiring_soon_sample': expiring_users,
    })


from django.utils import timezone
