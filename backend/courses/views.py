from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from django.db import transaction
from utils.auth import JWTCookieAuthentication, IsSuperUser
from .models import Course, UserCourseProgress
from .serializers import CourseSerializer, UserCourseProgressSerializer
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_protect


class GetCourseView(APIView):
    authentication_classes = [JWTCookieAuthentication]

    def get(self, request, course_id=None):
        if course_id:
            try:
                course = Course.objects.get(id=course_id)
            except Course.DoesNotExist:
                return Response(
                    {"error": "Course not found", "no_course": True},
                    status=status.HTTP_404_NOT_FOUND,
                )

            course_serializer = CourseSerializer(course)
            return Response(
                {"course": course_serializer.data}, status=status.HTTP_200_OK
            )

        courses = Course.objects.all()
        if not courses.exists():
            return Response({"info": "No course yet"}, status=status.HTTP_404_NOT_FOUND)

        course_serializers = CourseSerializer(courses, many=True)
        return Response({"courses": course_serializers.data}, status=status.HTTP_200_OK)


class CourseOperationView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAdminUser]

    def post(self, request):
        course_serializer = CourseSerializer(data=request.data)
        if course_serializer.is_valid():
            course_serializer.save()
            return Response(
                {"course": course_serializer.data}, status=status.HTTP_200_OK
            )
        return Response(
            {"errors": course_serializer.errors}, status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, course_id):
        try:
            inst = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(
                {"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND
            )

        course_serializer = CourseSerializer(
            inst,
            data=request.data,
            partial=True,
        )
        if course_serializer.is_valid():
            course_serializer.save()
            return Response(
                {"course": course_serializer.data}, status=status.HTTP_200_OK
            )

        return Response(
            {"errors": course_serializer.errors}, status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(
                {"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND
            )

        course.delete()
        return Response(
            {"message": "Course deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


class UserCourseProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)

        progress, created = UserCourseProgress.objects.get_or_create(
            user=request.user,
            course=course,
            defaults={
                "status": UserCourseProgress.STATUS_STARTED,
                "started_at": timezone.now(),
            },
        )

        serializer = UserCourseProgressSerializer(progress)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, course_id):
        """
        Update course status (started / finished)
        Automatically manages started_at and finished_at
        """

        course = get_object_or_404(Course, id=course_id)

        progress, created = UserCourseProgress.objects.get_or_create(
            user=request.user,
            course=course,
            defaults={
                "status": UserCourseProgress.STATUS_STARTED,
                "started_at": timezone.now(),
            },
        )

        serializer = UserCourseProgressSerializer(
            progress,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            instance = serializer.save()

            # Ensure started_at is set if not already
            if not instance.started_at:
                instance.started_at = timezone.now()

            # Handle status logic
            if instance.status == UserCourseProgress.STATUS_FINISHED:
                if not instance.finished_at:
                    instance.finished_at = timezone.now()
            else:
                # If status changed back to "started"
                instance.finished_at = None

            instance.save()

            return Response(
                UserCourseProgressSerializer(instance).data,
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
