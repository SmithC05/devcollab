from rest_framework.authentication import BaseAuthentication

class CustomMiddlewareAuthentication(BaseAuthentication):
    """
    Authentication class that bridges JWTAuthMiddleware → DRF.
    JWTAuthMiddleware sets request.user from the Bearer token before DRF
    runs, so we just read that value here.

    authenticate_header() is implemented so that DRF returns HTTP 401
    (instead of the misleading 403) when the user is unauthenticated.
    This allows the frontend to detect an expired token and refresh it.
    """
    def authenticate(self, request):
        user = getattr(request._request, 'user', None)
        if user and user.is_authenticated:
            return (user, None)
        return None

    def authenticate_header(self, request):
        # Returning a non-empty string makes DRF emit a 401 (with
        # WWW-Authenticate header) instead of a 403 for unauthenticated
        # requests, which is the correct HTTP semantics.
        return 'Bearer realm="api"'
