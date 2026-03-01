# backend/utils/csrf.py
from django.http import JsonResponse


def csrf_failure_view(request, reason=""):
    return JsonResponse(
        {"error": "CSRF validation failed", "detail": reason}, status=403
    )
