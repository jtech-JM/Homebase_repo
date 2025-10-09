
from django.db import models
from django.conf import settings

class Role(models.Model):
	name = models.CharField(max_length=50, unique=True)
	description = models.TextField(blank=True)

class UserRole(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	role = models.ForeignKey(Role, on_delete=models.CASCADE)
	assigned_at = models.DateTimeField(auto_now_add=True)
