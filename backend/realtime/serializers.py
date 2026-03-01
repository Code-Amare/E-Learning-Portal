from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Notification
from users.serializers import UserSerializer

User = get_user_model()


class NotificationSerializer(serializers.ModelSerializer):
    recipient = UserSerializer(read_only=True)
    actor = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "actor",
            "title",
            "description",
            "code",
            "url",
            "is_read",
            "sent_at",
        ]
        read_only_fields = [
            "id",
            "recipient",
            "actor",
            "sent_at",
        ]
