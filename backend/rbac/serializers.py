from rest_framework import serializers
from .models import Role, UserRole

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name", "description"]

class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ["id", "user", "role", "assigned_at"]
