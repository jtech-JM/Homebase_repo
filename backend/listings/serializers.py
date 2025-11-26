from rest_framework import serializers
from .models import Listing, Booking, MaintenanceRequest, PropertyDocument
from users.serializers import UserSerializer
from django.utils.timesince import timesince
from django.conf import settings
import os

class ListingSerializer(serializers.ModelSerializer):
    landlord = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    property_type_display = serializers.CharField(source='get_property_type_display', read_only=True)
    image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    location = serializers.CharField(source='address')

    def get_image(self, obj):
        if obj.images:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.images[0])
            return obj.images[0]
        return None

    def get_images(self, obj):
        if obj.images:
            request = self.context.get('request')
            if request:
                return [request.build_absolute_uri(image) for image in obj.images]
            return obj.images
        return []

    def create(self, validated_data):
        images_data = self.context['request'].FILES.getlist('images[]')
        validated_data.pop('images', None)  # Remove images from validated_data as we'll handle it separately
        listing = super().create(validated_data)
        if images_data:
            image_urls = self.save_images(images_data, listing.id)
            listing.images = image_urls
            listing.save()
        return listing

    def update(self, instance, validated_data):
        images_data = self.context['request'].FILES.getlist('images[]')
        validated_data.pop('images', None)  # Remove images from validated_data
        listing = super().update(instance, validated_data)
        if images_data:
            image_urls = self.save_images(images_data, listing.id)
            listing.images = (listing.images or []) + image_urls  # Append new images to existing
            listing.save()
        return listing

    def save_images(self, images_data, listing_id):
        image_urls = []
        for image in images_data:
            # Create directory if it doesn't exist
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'listing_images', str(listing_id))
            os.makedirs(upload_dir, exist_ok=True)

            # Save the file
            file_path = os.path.join(upload_dir, image.name)
            with open(file_path, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)

            # Generate URL
            image_url = f"{settings.MEDIA_URL}listing_images/{listing_id}/{image.name}"
            image_urls.append(image_url)
        return image_urls

    class Meta:
        model = Listing
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    listing = ListingSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    studentImage = serializers.SerializerMethodField()
    studentName = serializers.SerializerMethodField()
    propertyName = serializers.CharField(source='listing.title', read_only=True)
    timeAgo = serializers.SerializerMethodField()

    def get_studentImage(self, obj):
        return getattr(obj.student, 'avatar', None)

    def get_studentName(self, obj):
        return obj.student.get_full_name() or obj.student.email

    def get_timeAgo(self, obj):
        return timesince(obj.created_at)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make listing writable during creation
        if self.instance is None:  # Creating new instance
            self.fields['listing'] = serializers.PrimaryKeyRelatedField(
                queryset=Listing.objects.all()
            )

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['studentImage', 'studentName', 'timeAgo', 'status_display']
        extra_kwargs = {
            'start_date': {'required': False},
            'end_date': {'required': False},
        }

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
