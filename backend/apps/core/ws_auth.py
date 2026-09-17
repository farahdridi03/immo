import urllib.parse
try:
    from channels.db import database_sync_to_async  # type: ignore
except ImportError:
    from asgiref.sync import sync_to_async as database_sync_to_async  # type: ignore

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        access_token = AccessToken(token_key)
        user_id = access_token.get("user_id")
        if user_id is not None:
            user = User.objects.select_related("entreprise").get(id=int(user_id))
            if user.is_active:
                return user
        return AnonymousUser()
    except Exception as e:
        print(f"[WebSocket Auth Error] {e}")
        return AnonymousUser()

class JwtAuthMiddleware:
    """
    Custom Channels middleware that authenticates WebSocket connections
    using JWT access token passed in the query string (?token=...)
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = urllib.parse.parse_qs(query_string)
        token_list = query_params.get("token", [])
        token = token_list[0] if token_list else None

        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)

def JwtAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(inner)
