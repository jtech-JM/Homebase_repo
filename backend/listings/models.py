from django.db import models
from django.conf import settings

class Listing(models.Model): 
    LISTING_STATUS_CHOICES = [
        ("available", "Available"),
        ("booked", "Booked"),
        ("pending", "Pending"),
        ("inactive", "Inactive"),
        ("maintenance", "Under Maintenance"),
    ]
    PROPERTY_TYPE_CHOICES = [
        ("apartment", "Apartment"),
        ("house", "House"),
        ("studio", "Studio"),
        ("shared", "Shared Room"),
    ]
    landlord = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listings')
    title = models.CharField(max_length=200)
    description = models.TextField()
    address = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=LISTING_STATUS_CHOICES, default="available")
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES, default="apartment")
    bedrooms = models.PositiveIntegerField(default=1)
    bathrooms = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)
    amenities = models.JSONField(default=list, blank=True)
    images = models.JSONField(default=list, blank=True)
    square_feet = models.PositiveIntegerField(null=True, blank=True)
    lease_term = models.PositiveIntegerField(default=12)  # in months
    available_from = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} - {self.address}"

    class Meta:
        ordering = ['-created_at']

class Booking(models.Model):
    BOOKING_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='bookings')
    status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default="pending")
    start_date = models.DateField()
    end_date = models.DateField()
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    lease_document = models.FileField(upload_to='leases/', null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.student.email} - {self.listing.title}"

    class Meta:
        ordering = ['-created_at']

class MaintenanceRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("emergency", "Emergency"),
    ]
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='maintenance_requests')
    tenant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='maintenance_requests')
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    scheduled_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    assigned_to = models.CharField(max_length=200, blank=True)
    images = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.title} - {self.listing.title}"

    class Meta:
        ordering = ['-created_at']

class PropertyDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ("lease", "Lease Agreement"),
        ("maintenance", "Maintenance Record"),
        ("inspection", "Inspection Report"),
        ("receipt", "Payment Receipt"),
        ("other", "Other"),
    ]
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    file = models.FileField(upload_to='property_documents/')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.title} - {self.listing.title}"

    class Meta:
        ordering = ['-created_at']