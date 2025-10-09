
from rest_framework import viewsets, permissions
from .models import Role, UserRole
from .serializers import RoleSerializer, UserRoleSerializer

class RoleViewSet(viewsets.ModelViewSet):
	queryset = Role.objects.all()
	serializer_class = RoleSerializer
	permission_classes = [permissions.IsAdminUser]

class UserRoleViewSet(viewsets.ModelViewSet):
	queryset = UserRole.objects.all()
	serializer_class = UserRoleSerializer
	permission_classes = [permissions.IsAdminUser]
