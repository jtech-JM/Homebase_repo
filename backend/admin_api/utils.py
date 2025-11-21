from .models import AdminActivityLog


def log_admin_action(admin, action, target_model, target_id, description, metadata=None, ip_address=None):
    """
    Log an admin action for audit purposes
    
    Args:
        admin: User object of the admin performing the action
        action: Type of action (from AdminActivityLog.ACTION_CHOICES)
        target_model: Name of the model being affected
        target_id: ID of the target object
        description: Human-readable description of the action
        metadata: Optional dict with additional context
        ip_address: IP address of the admin
    """
    AdminActivityLog.objects.create(
        admin=admin,
        action=action,
        target_model=target_model,
        target_id=target_id,
        description=description,
        metadata=metadata or {},
        ip_address=ip_address
    )


def get_client_ip(request):
    """
    Get the client IP address from the request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
