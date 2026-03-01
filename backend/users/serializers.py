from rest_framework import serializers
from django.contrib.auth import get_user_model
import cloudinary.uploader
import cloudinary.utils
import time
from .models import Profile

User = get_user_model()

import time
import environ
import cloudinary
import cloudinary.utils
from pathlib import Path

env = environ.Env()
BASE_DIR = Path(__file__).resolve().parent
environ.Env.read_env(str(BASE_DIR / ".env"))

cloudinary.config(
    cloud_name=env("CLOUD_NAME"),
    api_key=env("CLOUD_API_KEY"),
    api_secret=env("CLOUD_API_SECRET"),
    secure=True,
)


class ProfileInverseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Profile
        fields = ["grade", "section", "field", "account", "phone_number"]


class UserInverseSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    profile_pic_url = serializers.SerializerMethodField()
    profile = ProfileInverseSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "role",
            "gender",
            "email_verified",
            "twofa_enabled",
            "profile_pic_id",
            "profile_pic_url",
            "password",
            "profile",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_deleted",
            "date_joined",
            "notif_enabled",
            "push_notif_enabled",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        profile_pic_file = self.context["request"].FILES.get("profile_pic")
        if profile_pic_file:
            validated_data["profile_pic_id"] = self.upload_private_file(
                profile_pic_file
            )

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        profile_pic_file = self.context["request"].FILES.get("profile_pic")
        if profile_pic_file:
            validated_data["profile_pic_id"] = self.upload_private_file(
                profile_pic_file
            )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def get_profile_pic_url(self, obj):
        if obj.profile_pic_id:
            try:
                return self.get_signed_url(obj.profile_pic_id)
            except Exception as e:
                # Log the error but don't crash the whole API request
                print(f"Cloudinary error: {e}")
                return None
        return None

    # --- helper methods ---
    def upload_private_file(self, file):
        result = cloudinary.uploader.upload(
            file, folder="users/profiles", resource_type="image", type="authenticated"
        )
        return result["public_id"]

    def get_signed_url(self, public_id, expires_in=30):
        url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type="image",
            type="authenticated",
            sign_url=True,
            secure=True,
            expires_at=int(time.time()) + expires_in,
        )
        return url


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    profile_pic_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "role",
            "gender",
            "email_verified",
            "twofa_enabled",
            "profile_pic_id",
            "profile_pic_url",
            "password",
            "has_password",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_deleted",
            "date_joined",
            "notif_enabled",
            "push_notif_enabled",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        profile_pic_file = self.context["request"].FILES.get("profile_pic")
        if profile_pic_file:
            validated_data["profile_pic_id"] = self.upload_private_file(
                profile_pic_file
            )

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):

        if "email" in validated_data:
            validated_data.pop("email")

        password = validated_data.pop("password", None)
        profile_pic_file = self.context["request"].FILES.get("profile_pic")
        if profile_pic_file:
            validated_data["profile_pic_id"] = self.upload_private_file(
                profile_pic_file
            )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def get_profile_pic_url(self, obj):
        if obj.profile_pic_id:
            try:
                return self.get_signed_url(obj.profile_pic_id)
            except Exception as e:
                # Log the error but don't crash the whole API request
                print(f"Cloudinary error: {e}")
                return None
        return None

    # --- helper methods ---
    def upload_private_file(self, file):
        result = cloudinary.uploader.upload(
            file, folder="users/profiles", resource_type="image", type="authenticated"
        )
        return result["public_id"]

    def get_signed_url(self, public_id, expires_in=30):
        url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type="image",
            type="authenticated",
            sign_url=True,
            secure=True,
            expires_at=int(time.time()) + expires_in,
        )
        return url


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Profile
        fields = ["user", "grade", "section", "field", "account", "phone_number"]
