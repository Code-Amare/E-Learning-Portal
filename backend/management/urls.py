from django.urls import path
from .views import (
    StudentsView,
    StudentDetailView,
    StudentCreateView,
    StudentsBulkUploadView,
    StudentsExportView,
    StudentsStatsView,
    StudentTemplateView,
    StudentDeleteView,
    StudentUpdateView,
    GetAllUsersView,
    DashboardView,
    StudentDataView,
    SettingUpdateView,
    GradesRankExportPdfView,
    StudentsBulkOperationView,
    AdminControlView,
)

urlpatterns = [
    path("users/", GetAllUsersView.as_view(), name="get-users"),
    path("admins/", AdminControlView.as_view(), name="admin-control"),
    path("admin/<int:pk>/", AdminControlView.as_view(), name="admin-user"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("students/", StudentsView.as_view(), name="students-list"),
    path("students/stats/", StudentsStatsView.as_view(), name="students-stats"),
    path("students/create/", StudentCreateView.as_view(), name="student-create"),
    path("student/edit/<int:pk>/", StudentUpdateView.as_view(), name="student-edit"),
    path("setting/", SettingUpdateView.as_view(), name="edit-setting"),
    path(
        "student/delete/<int:pk>/", StudentDeleteView.as_view(), name="student-delete"
    ),
    path(
        "student/<int:student_id>/", StudentDetailView.as_view(), name="student-detail"
    ),
    path(
        "student/data/<int:student_id>/",
        StudentDataView.as_view(),
        name="student-detail",
    ),
    path(
        "students/bulk-upload/",
        StudentsBulkUploadView.as_view(),
        name="students-bulk-upload",
    ),
    path(
        "students/bulk/",
        StudentsBulkOperationView.as_view(),
        name="students-bulk-operation",
    ),
    path("stats/", StudentsStatsView.as_view(), name="students-stats"),
    path("students/template/", StudentTemplateView.as_view(), name="student-template"),
    path("students/export/", StudentsExportView.as_view(), name="students-export"),
    path(
        "students/grade/export/", GradesRankExportPdfView.as_view(), name="grade-export"
    ),
]
