from rest_framework.authentication import BaseAuthentication

class CustomMiddlewareAuthentication(BaseAuthentication):
    """
    Dummy authentication class that returns the request.user 
    already set by JWTAuthMiddleware.
    This bypasses DRF's SessionAuthentication and its CSRF enforcement 
    for API endpoints, since we rely on Bearer tokens.
    """
    def authenticate(self, request):
        user = getattr(request._request, 'user', None)
        if user and user.is_authenticated:
            return (user, None)
        return None
