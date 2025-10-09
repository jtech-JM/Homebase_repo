
from django.db import models
from django.conf import settings

class Payment(models.Model):
	PAYMENT_STATUS_CHOICES = [
		("pending", "Pending"),
		("completed", "Completed"),
		("refunded", "Refunded"),
		("failed", "Failed"),
	]
	payer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments_made")
	payee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments_received")
	amount = models.DecimalField(max_digits=10, decimal_places=2)
	status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	reference = models.CharField(max_length=100, blank=True)

class Escrow(models.Model):
	payment = models.OneToOneField(Payment, on_delete=models.CASCADE)
	released = models.BooleanField(default=False)
	released_at = models.DateTimeField(null=True, blank=True)
