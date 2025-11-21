from django.db import models
from django.conf import settings
from listings.models import Listing, Booking

class Payment(models.Model):
	PAYMENT_STATUS_CHOICES = [
		("pending", "Pending"),
		("completed", "Completed"),
		("refunded", "Refunded"),
		("failed", "Failed"),
	]

	PAYMENT_TYPE_CHOICES = [
		("rent", "Rent Payment"),
		("deposit", "Security Deposit"),
		("fee", "Service Fee"),
		("maintenance", "Maintenance Fee"),
	]

	payer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments_made")
	payee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments_received")
	amount = models.DecimalField(max_digits=10, decimal_places=2)
	status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending")
	payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default="rent")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	reference = models.CharField(max_length=100, blank=True)

	# Optional relationships
	listing = models.ForeignKey(Listing, on_delete=models.SET_NULL, null=True, blank=True)
	booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True)

	# Payment dates
	due_date = models.DateTimeField(null=True, blank=True)
	paid_at = models.DateTimeField(null=True, blank=True)

	# Payment method and gateway info
	payment_method = models.CharField(max_length=50, blank=True)  # e.g., 'stripe', 'paypal'
	gateway_transaction_id = models.CharField(max_length=100, blank=True)

	def __str__(self):
		return f"{self.payer.get_full_name()} -> {self.payee.get_full_name()}: ${self.amount} ({self.status})"

class Escrow(models.Model):
	payment = models.OneToOneField(Payment, on_delete=models.CASCADE)
	released = models.BooleanField(default=False)
	released_at = models.DateTimeField(null=True, blank=True)

	def __str__(self):
		return f"Escrow for Payment {self.payment.id}"
