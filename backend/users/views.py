from rest_framework import viewsets, permissions,status
from rest_framework.decorators import  action
from rest_framework.response import Response
from .models import User, Student, Landlord, Agent
from .serializers import UserSerializer, StudentSerializer, LandlordSerializer, AgentSerializer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from listings.models import Listing, Booking
from listings.serializers import ListingSerializer
from messaging.models import Message, Conversation
from payments.models import Payment
from django.db.models import Q, Count
from django.utils.timesince import timesince
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

        # Determine redirect URL based on role
        redirect_url = f"/dashboard/{role}"

        return Response({
            "message": "Role updated successfully",
            "redirect_url": redirect_url,
            "role": role
        })

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

        # Generate fresh JWT tokens with the updated role
        refresh = RefreshToken.for_user(request.user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        return Response({
            "message": "Role updated successfully",
            "user": {
                "id": request.user.id,
                "email": request.user.email,
                "role": request.user.role,
                "name": f"{request.user.first_name} {request.user.last_name}".strip() or request.user.email.split('@')[0]
            },
            "access": access_token,
            "refresh": refresh_token
        })

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

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def dashboard(self, request):
        """
        Get student dashboard data including profile, recommendations, and recent activity
        """
        if request.user.role != 'student':
            return Response({"error": "Access denied. Student role required."}, status=status.HTTP_403_FORBIDDEN)

        # Get profile data
        profile_data = {
            "verificationStatus": "verified" if hasattr(request.user, 'student') and request.user.student.student_id else "pending",
            "activeBookings": Booking.objects.filter(student=request.user, status='active').count(),
            "savedListings": 0,  # TODO: Implement saved listings feature
            "unreadMessages": Message.objects.filter(
                conversation__participants=request.user,
                is_read=False
            ).exclude(sender=request.user).count(),
        }

        # Get recommended listings (available listings, limit to 4)
        recommended_listings = Listing.objects.filter(
            status='available'
        ).select_related('landlord')[:4]

        recommended_data = []
        for listing in recommended_listings:
            serializer = ListingSerializer(listing, context={'request': request})
            listing_data = serializer.data
            recommended_data.append({
                "id": listing_data['id'],
                "title": listing_data['title'],
                "location": listing_data['address'],
                "price": float(listing_data['price']),
                "image": listing_data['image'] or '/placeholder.png'
            })

        # Get recent activity (bookings, messages, payments)
        recent_activity = []

        # Recent bookings
        recent_bookings = Booking.objects.filter(
            student=request.user
        ).select_related('listing').order_by('-created_at')[:3]

        for booking in recent_bookings:
            recent_activity.append({
                "icon": "📅",
                "title": f"Booking {'confirmed' if booking.status == 'approved' else booking.status}",
                "description": f"Your booking for {booking.listing.title} has been {booking.status}",
                "time": timesince(booking.created_at)
            })

        # Recent messages
        recent_messages = Message.objects.filter(
            conversation__participants=request.user
        ).exclude(sender=request.user).select_related('sender', 'conversation').order_by('-created_at')[:2]

        for message in recent_messages:
            recent_activity.append({
                "icon": "💬",
                "title": "New message",
                "description": f"Message from {message.sender.get_full_name() or message.sender.email}",
                "time": timesince(message.created_at)
            })

        # Recent payments
        recent_payments = Payment.objects.filter(
            payer=request.user,
            status='completed'
        ).order_by('-paid_at')[:2]

        for payment in recent_payments:
            recent_activity.append({
                "icon": "💰",
                "title": "Payment completed",
                "description": f"${payment.amount} paid for {payment.get_payment_type_display()}",
                "time": timesince(payment.paid_at) if payment.paid_at else "Recently"
            })

        # Sort recent activity by time (most recent first)
        recent_activity.sort(key=lambda x: x['time'])

        return Response({
            "profile": profile_data,
            "recommendedListings": recommended_data,
            "recentActivity": recent_activity[:5]  # Limit to 5 most recent
        })

    @action(detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def set_password(self, request):
        """
        Allow social login users to set a password for email/password authentication
        Endpoint: POST /api/users/set_password/
        """
        user = request.user
        new_password = request.data.get("new_password")
        current_password = request.data.get("current_password")

        if not new_password:
            return Response(
                {"error": "New password is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate password strength
        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # If user has a usable password, require current password
        if user.has_usable_password():
            if not current_password:
                return Response(
                    {"error": "Current password is required to change password"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not user.check_password(current_password):
                return Response(
                    {"error": "Current password is incorrect"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Set the new password
        user.set_password(new_password)
        user.save()

        return Response({
            "message": "Password set successfully. You can now login with email and password.",
            "has_password": True
        })

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def check_password_status(self, request):
        """
        Check if user has a usable password
        Endpoint: GET /api/users/check_password_status/
        """
        user = request.user
        return Response({
            "has_usable_password": user.has_usable_password(),
            "email": user.email
        })

