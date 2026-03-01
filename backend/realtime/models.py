from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):

    CODE_CHOICE = [
        ("success", "Success"),
        ("warning", "Warning"),
        ("error", "Error"),
        ("info", "Info"),
    ]

    recipient = models.ForeignKey(
        User, related_name="received_notifications", on_delete=models.CASCADE
    )
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
    )
    is_read = models.BooleanField(default=False)
    title = models.CharField(max_length=50)
    description = models.TextField()
    code = models.CharField(max_length=10, choices=CODE_CHOICE, default="info")
    url = models.URLField(blank=True, null=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-sent_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["recipient", "sent_at"]),
        ]
