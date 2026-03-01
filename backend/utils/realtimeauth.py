from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware


@database_sync_to_async
def get_user_from_scope(scope):
    from django.contrib.auth.models import AnonymousUser
    from utils.auth import JWTCookieAuthentication

    # Extract cookies from headers
    cookies = {}
    for name, value in scope["headers"]:
        if name == b"cookie":
            raw = value.decode()
            parts = raw.split(";")
            for part in parts:
                key, _, val = part.strip().partition("=")
                cookies[key] = val

    # Build a fake request object
    request = type("Request", (), {"COOKIES": cookies})()

    # Use your class exactly as-is
    auth = JWTCookieAuthentication()

    try:
        user_tuple = auth.authenticate(request)
        if user_tuple:
            user, _ = user_tuple
            return user
        return AnonymousUser()
    except:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        scope["user"] = await get_user_from_scope(scope)
        return await super().__call__(scope, receive, send)
