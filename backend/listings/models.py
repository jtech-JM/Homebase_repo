from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Listing(models.Model):
    LISTING_STATUS_CHOICES = [
        ('available', 'Available'),
        ('booked', 'Booked'),
        ('maintenance', 'Under Maintenance'),
        ('inactive', 'Inactive'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    address = models.CharField(max_length=300)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    bedrooms = models.IntegerField(default=1)
    bathrooms = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)
    square_feet = models.IntegerField(null=True, blank=True)
    property_type = models.CharField(max_length=50, choices=[
        ('apartment', 'Apartment'),
        ('house', 'House'),
        ('studio', 'Studio'),
        ('room', 'Room'),
        ('duplex', 'Duplex'),
    ])
    amenities = models.JSONField(default=list, blank=True)
    images = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=LISTING_STATUS_CHOICES, default='available')
    available_from = models.DateField(null=True, blank=True)
    lease_term = models.CharField(max_length=50, choices=[
        ('month-to-month', 'Month to Month'),
        ('6-months', '6 Months'),
        ('12-months', '12 Months'),
        ('24-months', '24 Months'),
    ], default='12-months')
    verified = models.BooleanField(default=False)
    featured = models.BooleanField(default=False)
    landlord = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='listings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    
    @property
    def is_student_housing(self):
        """Check if this is student housing."""
        title_lower = self.title.lower() if self.title else ''
        desc_lower = self.description.lower() if self.description else ''
        return 'student' in title_lower or 'university' in desc_lower
    
    def get_verification_required_score(self):
        """Get minimum verification score required for this listing."""
        if self.is_student_housing:
            return 70  # Verified students only
        return 0  # No verification required for regular listings
    
    @property
    def price_per_night(self):
        """Alias for price field for compatibility."""
        return self.price
    
    @property
    def location(self):
        """Alias for address field for compatibility."""
        return self.address

    class Meta:
        ordering = ['-created_at']


class Booking(models.Model):
    BOOKING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
    ]

    student = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='bookings')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='bookings')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.listing.title}"

    class Meta:
        ordering = ['-created_at']


class MaintenanceRequest(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    tenant = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='maintenance_requests')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='maintenance_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class PropertyDocument(models.Model):
    DOCUMENT_TYPES = [
        ('lease', 'Lease Agreement'),
        ('inspection', 'Inspection Report'),
        ('permit', 'Permit'),
        ('warranty', 'Warranty'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, default='other')
    file = models.FileField(upload_to='property_documents/')
    uploaded_by = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='uploaded_documents')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='documents')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class Review(models.Model):
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reviews')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.listing.title} ({self.rating} stars)"

    class Meta:
        ordering = ['-created_at']
