from rest_framework import serializers
from .models import Listing, Booking, MaintenanceRequest, PropertyDocument
from users.serializers import UserSerializer
from django.utils.timesince import timesince

class ListingSerializer(serializers.ModelSerializer):
    landlord = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    property_type_display = serializers.CharField(source='get_property_type_display', read_only=True)
    image = serializers.SerializerMethodField()
    location = serializers.CharField(source='address')

    def get_image(self, obj):
        return obj.images[0] if obj.images else None

    class Meta:
        model = Listing
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    listing = ListingSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    studentImage = serializers.SerializerMethodField()
    studentName = serializers.SerializerMethodField()
    propertyName = serializers.CharField(source='listing.title')
    timeAgo = serializers.SerializerMethodField()

    def get_studentImage(self, obj):
        return getattr(obj.student, 'avatar', None)

    def get_studentName(self, obj):
        return obj.student.get_full_name() or obj.student.email

    def get_timeAgo(self, obj):
        return timesince(obj.created_at)

    class Meta:
        model = Booking
        fields = '__all__'

class MaintenanceRequestSerializer(serializers.ModelSerializer):
    tenant = UserSerializer(read_only=True)
    listing = ListingSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = MaintenanceRequest
        fields = '__all__'

class PropertyDocumentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    listing = ListingSerializer(read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)

    class Meta:
        model = PropertyDocument
        fields = '__all__'

# Simplified serializers for nested relationships
class SimpleListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = ['id', 'title', 'address', 'status', 'price']

class SimpleBookingSerializer(serializers.ModelSerializer):
    listing = SimpleListingSerializer(read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'listing', 'status', 'start_date', 'end_date']

class SimpleMaintenanceRequestSerializer(serializers.ModelSerializer):
    listing = SimpleListingSerializer(read_only=True)

    class Meta:
        model = MaintenanceRequest
        fields = ['id', 'title', 'status', 'priority', 'created_at']
