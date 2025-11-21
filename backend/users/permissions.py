from rest_framework.permissions import BasePermission

class IsStudent(BasePermission):
    """
    Custom permission to only allow students to access the view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'

class IsLandlord(BasePermission):
    """
    Custom permission to only allow landlords to access the view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'landlord'

class IsAgent(BasePermission):
    """
    Custom permission to only allow agents to access the view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'agent'

class IsAdmin(BasePermission):
    """
    Custom permission to only allow admins to access the view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsLandlordOrAgent(BasePermission):
    """
    Custom permission to allow both landlords and agents to access the view.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['landlord', 'agent']
        )

class IsStudentOrAdmin(BasePermission):
    """
    Custom permission to allow both students and admins to access the view.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['student', 'admin']
        )
