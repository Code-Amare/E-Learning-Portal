from django.urls import path
from .views import (
    GetNotificationBulkView,
    MarkAsReadView,
    DetailNotifView,
    GetNotificationView,
    DeleteOldNotificationsView,
)

urlpatterns = [
    path("notif/", GetNotificationBulkView.as_view(), name="get-bulk-notif"),
    path("get-notif/<int:notif_id>/", GetNotificationView.as_view(), name="get-notif"),
    path("mark-read/", MarkAsReadView.as_view(), name="mark-read"),
    path("notif/<int:notif_id>/", DetailNotifView.as_view(), name="notif-detail"),
    path("notif/delete-old/", DeleteOldNotificationsView.as_view()),
]
