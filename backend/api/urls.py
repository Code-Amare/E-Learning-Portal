from django.urls import path, include
from .views import SiteView

urlpatterns = [
    path("site/", SiteView.as_view()),
    path("users/", include("users.urls")),
    path("realtime/", include("realtime.urls")),
    path("management/", include("management.urls")),
    path("learning-task/", include("learning_task.urls")),
    path("attendance/", include("attendance.urls")),
    path("announcement/", include("announcement.urls")),
]
