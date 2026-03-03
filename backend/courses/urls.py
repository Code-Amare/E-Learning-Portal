from django.urls import path
from .views import (
    GetCourseView,
    GetCourseView,
    CourseOperationView,
    CourseOperationView,
    CourseOperationView,
    UserCourseProgressView,
    UserCourseView,
    GetCoursesWithProgressView,
)

urlpatterns = [
    # Get courses - single or all
    path("", GetCourseView.as_view(), name="course-list"),
    path("<int:course_id>/", GetCourseView.as_view(), name="course-detail"),
    # Course operations (Admin only)
    path("create/", CourseOperationView.as_view(), name="course-create"),
    path(
        "<int:course_id>/update/",
        CourseOperationView.as_view(),
        name="course-update",
    ),
    path(
        "<int:course_id>/delete/",
        CourseOperationView.as_view(),
        name="course-delete",
    ),
    # User course progress
    path(
        "<int:course_id>/progress/",
        UserCourseProgressView.as_view(),
        name="course-progress",
    ),
    path("user/<int:user_id>/", UserCourseView.as_view(), name="student-courses"),
    path(
        "with-progress/", GetCoursesWithProgressView.as_view(), name="student-courses"
    ),
]
