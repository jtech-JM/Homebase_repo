"""API views for monitoring and reporting."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .monitoring import monitoring_service


@api_view(['GET'])
@permission_classes([IsAdminUser])
def system_health(request):
    """Get system health metrics."""
    health = monitoring_service.get_system_health()
    return Response(health)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def verification_metrics(request):
    """Get verification distribution metrics."""
    metrics = monitoring_service.get_verification_metrics()
    return Response(metrics)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def feature_usage(request):
    """Get feature usage statistics."""
    usage = monitoring_service.get_feature_usage()
    return Response({'features': usage})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def comprehensive_report(request):
    """Get comprehensive monitoring report."""
    period = request.query_params.get('period', 'daily')
    report = monitoring_service.generate_report(period)
    return Response(report)
