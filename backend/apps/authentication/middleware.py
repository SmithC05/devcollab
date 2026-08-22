from django.contrib.auth import get_user_model
from django.utils.deprecation import MiddlewareMixin
from .jwt_utils import decode_token

User = get_user_model()

class JWTAuthMiddleware(MiddlewareMixin):
    def process_request(self, request):
        access_token = request.COOKIES.get('access_token')
        
        if access_token:
            try:
                payload = decode_token(access_token)
                user_id = payload.get('user_id')
                if user_id:
                    user = User.objects.filter(id=user_id).first()
                    if user:
                        request.user = user
            except Exception as e:
                # Token expired or invalid
                pass
