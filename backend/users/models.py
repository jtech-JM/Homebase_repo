from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("landlord", "Landlord"),
        ("agent", "Agent"),
        ("admin", "Admin"),
        ("pending", "Pending"),
    ]
    username = None  # Remove username field
    email = models.EmailField(unique=True)  # Make email the unique identifier
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="pending")
    phone = models.CharField(max_length=20, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['role']

    objects = CustomUserManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['email'],
                name='unique_email'
            )
        ]

    # Role-based properties for easy permission checking
    @property
    def is_student(self):
        return self.role == 'student'

    @property
    def is_landlord(self):
        return self.role == 'landlord'

    @property
    def is_agent(self):
        return self.role == 'agent'

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_pending(self):
        return self.role == 'pending'

    # Add more shared fields if needed

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    university = models.CharField(max_length=100)
    student_id = models.CharField(max_length=50, blank=True)
    # student_id_doc uploaded via verification app

class Landlord(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    national_id = models.CharField(max_length=50)
    # proof_of_property uploaded via verification app

class Agent(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    national_id = models.CharField(max_length=50)
    campus_region = models.CharField(max_length=100)

# Admins are created by super admin, no extra fields needed
