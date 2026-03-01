from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.permissions import BasePermission


class JWTCookieAuthentication(JWTAuthentication):
    cookie_name = "access"

    def authenticate(self, request):
        token = request.COOKIES.get(self.cookie_name)
        if not token:
            return None

        try:
            validated_token = self.get_validated_token(token)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except (InvalidToken, TokenError):
            raise AuthenticationFailed("Invalid or expired token")


class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser
