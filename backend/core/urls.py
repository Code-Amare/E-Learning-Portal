# from django.views.generic import TemplateView
from django.urls import path, include, re_path

urlpatterns = [
    # re_path(r"^.*$", TemplateView.as_view(template_name="index.html")),
    path("api/", include("api.urls")),
]
