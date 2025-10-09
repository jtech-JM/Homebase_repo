from rest_framework import serializers
from .models import User, Student, Landlord, Agent
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer

class UserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'password', 're_password', 'role', 'phone')

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "role", "phone", "first_name", "last_name"]

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = Student
        fields = ["id", "user", "university", "student_id"]

class LandlordSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = Landlord
        fields = ["id", "user", "national_id"]

class AgentSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = Agent
        fields = ["id", "user", "national_id", "campus_region"]
