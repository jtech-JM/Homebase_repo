from rest_framework import viewsets, permissions,status
from rest_framework.decorators import  action
from rest_framework.response import Response
from .models import User, Student, Landlord, Agent
from .serializers import UserSerializer, StudentSerializer, LandlordSerializer, AgentSerializer
from django.contrib.auth import get_user_model
User = get_user_model()


class StudentViewSet(viewsets.ModelViewSet):
	queryset = Student.objects.all()
	serializer_class = StudentSerializer
	permission_classes = [permissions.AllowAny]

class LandlordViewSet(viewsets.ModelViewSet):
	queryset = Landlord.objects.all()
	serializer_class = LandlordSerializer
	permission_classes = [permissions.AllowAny]

class AgentViewSet(viewsets.ModelViewSet):
	queryset = Agent.objects.all()
	serializer_class = AgentSerializer
	permission_classes = [permissions.AllowAny]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["post"], permission_classes=[permissions.AllowAny])
    def social_login(self, request):
        """
        Custom endpoint: /users/social_login/
        """
        email = request.data.get("email")
        first_name = request.data.get("first_name", "")
        last_name = request.data.get("last_name", "")
        provider = request.data.get("provider", "")

        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "role": "student",  # default role
            }
        )

        if created:
            user.set_unusable_password()
            user.save()

        verification_status = (
            "approved" if getattr(user, "profile", None) and user.profile.verified else "pending"
        )

        return Response({
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "verification_status": verification_status,
            "provider": provider,
        })