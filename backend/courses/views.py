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


User = get_user_model()


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


class GetCoursesWithProgressView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get all courses
        courses = Course.objects.all().order_by("-created_at")

        # Get user's progress for all courses (efficient query)
        user_progress = {
            progress.course_id: progress
            for progress in UserCourseProgress.objects.filter(user=user)
        }

        # Prepare response
        course_list = []
        for course in courses:
            course_data = CourseSerializer(course).data
            progress = user_progress.get(course.id)

            if progress:
                course_data["progress"] = {
                    "status": progress.status,
                    "label": (
                        "In Progress" if progress.status == "started" else "Completed"
                    ),
                    "started_at": progress.started_at,
                    "finished_at": progress.finished_at,
                }
            else:
                course_data["progress"] = {
                    "status": "not_started",
                    "label": "Not Started",
                    "started_at": None,
                    "finished_at": None,
                }

            course_list.append(course_data)

        # Calculate counts
        started_count = len(
            [p for p in user_progress.values() if p.status == "started"]
        )
        finished_count = len(
            [p for p in user_progress.values() if p.status == "finished"]
        )

        return Response(
            {
                "courses": course_list,
                "summary": {
                    "total_courses": len(courses),
                    "started": started_count,
                    "finished": finished_count,
                    "not_started": len(courses) - (started_count + finished_count),
                },
            },
            status=status.HTTP_200_OK,
        )


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
    authentication_classes = [JWTCookieAuthentication]
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


class UserCourseView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User doesn't exist"}, status=status.HTTP_404_NOT_FOUND
            )
        courses_taken = UserCourseProgress.objects.filter(user=user)
        courses_taken_serializer = UserCourseProgressSerializer(
            courses_taken, many=True
        )
        started_courses_serializer = UserCourseProgressSerializer(
            courses_taken.filter(status="started"), many=True
        )
        finished_courses_serializer = UserCourseProgressSerializer(
            courses_taken.filter(status="finished"), many=True
        )

        return Response(
            {
                "courses_taken_serializer": courses_taken_serializer.data,
                "started_courses_serializer": started_courses_serializer.data,
                "finished_courses_serializer": finished_courses_serializer.data,
            },
            status=status.HTTP_200_OK,
        )
