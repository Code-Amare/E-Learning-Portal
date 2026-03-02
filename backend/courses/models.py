from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth import get_user_model


User = get_user_model()


class Course(models.Model):
    FIELD_CHOICE = [
        ("frontend", "Frontend"),
        ("backend", "Backend"),
        ("ai", "AI"),
        ("embedded", "Embedded"),
        ("cyber", "Cyber"),
        ("other", "Other"),
    ]
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)  # main text content
    short_note = models.CharField(max_length=500, blank=True)  # brief note or summary
    youtube_link = models.URLField(blank=True)  # YouTube video link
    field = models.CharField(max_length=10, choices=FIELD_CHOICE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class UserCourseProgress(models.Model):
    STATUS_STARTED = "started"
    STATUS_FINISHED = "finished"

    STATUS_CHOICE = [
        (STATUS_STARTED, "Started"),
        (STATUS_FINISHED, "Finished"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="course_progress"
    )
    course = models.ForeignKey(
        "Course", on_delete=models.CASCADE, related_name="user_progress"
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICE,
        default=STATUS_STARTED,
    )
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "course"], name="unique_user_course_progress"
            )
        ]

    def __str__(self):
        return f"{self.user.username} - {self.course.title} ({self.status})"
