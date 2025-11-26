from django.db import models
from django.conf import settings

class Profile(models.Model):
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	bio = models.TextField(blank=True)
	avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
	phone = models.CharField(max_length=20, blank=True)
	verified = models.BooleanField(default=False)
	date_of_birth = models.DateField(blank=True, null=True)
	address = models.CharField(max_length=255, blank=True)
	major = models.CharField(max_length=100, blank=True)
	graduation_year = models.IntegerField(blank=True, null=True)

	def __str__(self):
		return f"{self.user.get_full_name() or self.user.email}'s profile"
