from django.db import models
from django.conf import settings

class Verification(models.Model):
	VERIFICATION_TYPE_CHOICES = [
		("student_id", "Student ID"),
		("national_id", "National ID"),
		("property_proof", "Proof of Property"),
	]
	STATUS_CHOICES = [
		("pending", "Pending"),
		("approved", "Approved"),
		("rejected", "Rejected"),
	]
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	verification_type = models.CharField(max_length=30, choices=VERIFICATION_TYPE_CHOICES)
	document = models.FileField(upload_to="verifications/")
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
	submitted_at = models.DateTimeField(auto_now_add=True)
	reviewed_at = models.DateTimeField(null=True, blank=True)
	approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_verifications")
	rejection_reason = models.TextField(blank=True)
	# ...existing code...

class Review(models.Model):
	reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE)
	rating = models.PositiveSmallIntegerField()
	comment = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
	sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="messages_sent")
	recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="messages_received")
	content = models.TextField()
	sent_at = models.DateTimeField(auto_now_add=True)
