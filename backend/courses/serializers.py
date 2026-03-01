from rest_framework import serializers
from .models import Course, UserCourseProgress
from users.serializers import UserInverseSerializer


class CourseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "short_note",
            "youtube_link",
            "field",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]


class UserCourseProgressSerializer(serializers.ModelSerializer):
    user = UserInverseSerializer(read_only=True)
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())

    class Meta:
        model = UserCourseProgress
        fields = [
            "id",
            "user",
            "course",
            "status",
            "started_at",
            "finished_at",
        ]
        read_only_fields = [
            "id",
            "started_at",
            "finished_at",
        ]
