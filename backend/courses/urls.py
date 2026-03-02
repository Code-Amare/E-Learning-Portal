from django.urls import path
from . import views

urlpatterns = [
    # Get courses - single or all
    path("", views.GetCourseView.as_view(), name="course-list"),
    path("<int:course_id>/", views.GetCourseView.as_view(), name="course-detail"),
    # Course operations (Admin only)
    path("create/", views.CourseOperationView.as_view(), name="course-create"),
    path(
        "<int:course_id>/update/",
        views.CourseOperationView.as_view(),
        name="course-update",
    ),
    path(
        "<int:course_id>/delete/",
        views.CourseOperationView.as_view(),
        name="course-delete",
    ),
    # User course progress
    path(
        "<int:course_id>/progress/",
        views.UserCourseProgressView.as_view(),
        name="course-progress",
    ),
]
