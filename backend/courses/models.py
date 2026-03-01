from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone


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

    def save(self, *args, **kwargs):
        # Prevent reverting from finished → started
        if self.pk:
            old = UserCourseProgress.objects.get(pk=self.pk)
            if (
                old.status == self.STATUS_FINISHED
                and self.status == self.STATUS_STARTED
            ):
                raise ValidationError("Cannot revert a finished course.")

        # Auto-set timestamps properly
        if self.status == self.STATUS_STARTED and not self.started_at:
            self.started_at = timezone.now()

        if self.status == self.STATUS_FINISHED:
            if not self.started_at:
                self.started_at = timezone.now()
            if not self.finished_at:
                self.finished_at = timezone.now()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.course.title} ({self.status})"
