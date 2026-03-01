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


class GetCourseView(APIView):
    authentication_classes = [JWTCookieAuthentication]

    def get(self, request, course_id=None):
        if course_id:
            try:
                course = Course.objects.get(id=course_id)
            except Course.DoesNotExist:
                return Response(
                    {"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND
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


class ProgressMarkerView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UserCourseProgressSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        course = serializer.validated_data["course"]
        status_value = serializer.validated_data["status"]

        progress, created = UserCourseProgress.objects.get_or_create(
            user=request.user,
            course=course,
        )

        progress.status = status_value

        try:
            progress.save()  # Model enforces rules
        except ValidationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            UserCourseProgressSerializer(progress).data,
            status=status.HTTP_200_OK,
        )
