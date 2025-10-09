from rest_framework import viewsets, permissions,status
from rest_framework.decorators import  action
from rest_framework.response import Response
from .models import User, Student, Landlord, Agent
from .serializers import UserSerializer, StudentSerializer, LandlordSerializer, AgentSerializer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
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

    @action(detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def update_role(self, request):
        """
        Update user role
        """
        role = request.data.get("role")
        if role not in ["student", "landlord", "agent"]:
            return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        user.role = role
        user.save()

        return Response({"message": "Role updated successfully"})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def set_role(self, request, pk=None):
        """
        Set user role (alternative endpoint)
        """
        if str(request.user.id) != pk:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        role = request.data.get("role")
        if role not in ["student", "landlord", "agent"]:
            return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

        request.user.role = role
        request.user.save()

        return Response({"message": "Role updated successfully"})

    @action(detail=False, methods=["post"], permission_classes=[permissions.AllowAny])
    def social_login(self, request):
        """
        Custom endpoint: /users/social_login/
        """
        email = request.data.get("email")
        first_name = request.data.get("first_name", "")
        last_name = request.data.get("last_name", "")
        provider = request.data.get("provider", "")
        role = request.data.get("role", "student")  # allow role selection, default to student

        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "role": "pending",
            }
        )

        if created:
            user.set_unusable_password()
            user.save()

        verification_status = (
            "approved" if getattr(user, "profile", None) and user.profile.verified else "pending"
        )

        # Generate JWT tokens for the user
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        return Response({
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "verification_status": verification_status,
            "provider": provider,
            "is_new": created,
            "access": access_token,
            "refresh": refresh_token,
        })

