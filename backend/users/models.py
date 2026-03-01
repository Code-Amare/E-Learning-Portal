from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
import secrets


class ActiveUserManager(BaseUserManager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class UserManager(BaseUserManager):

    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", "admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")
        return self.create_user(email, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("user", "User"),
    )

    GENDER_CHOICES = (
        ("male", "Male"),
        ("female", "Female"),
    )

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="user")
    email_verified = models.BooleanField(default=False)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default="male")
    twofa_enabled = models.BooleanField(default=False)
    profile_pic_id = models.CharField(max_length=255, null=True, blank=True)
    has_password = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    push_notif_enabled = models.BooleanField(default=False)
    notif_enabled = models.BooleanField(default=True)

    objects = UserManager()
    active_users = ActiveUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    def __str__(self):
        return self.full_name


class VerifyEmail(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=5)

    def save(self, *args, **kwargs):
        if self.pk is None:
            self.code = secrets.randbelow(900000) + 100000

        super().save(*args, **kwargs)


class Profile(models.Model):
    FIELD_CHOICE = [
        ("frontend", "Frontend"),
        ("backend", "Backend"),
        ("ai", "AI"),
        ("embedded", "Embedded"),
        ("cyber", "Cyber"),
        ("other", "Other"),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    grade = models.PositiveSmallIntegerField()
    section = models.CharField(max_length=1)
    field = models.CharField(max_length=50, choices=FIELD_CHOICE, default="frontend")
    account = models.CharField(max_length=100, default="N/A")
    phone_number = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.full_name


class ChangePasswordViaEmail(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def save(self, *args, **kwargs):
        if self.pk is None:
            self.code = secrets.randbelow(900000) + 100000

        super().save(*args, **kwargs)
