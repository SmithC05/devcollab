import jwt
import datetime
from django.conf import settings

def generate_access_token(user_id):
    payload = {
        'user_id': str(user_id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRY),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm='HS256')

def generate_refresh_token(user_id):
    payload = {
        'user_id': str(user_id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRY),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm='HS256')

def decode_token(token):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token has expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')

def set_auth_cookies(response, access_token, refresh_token):
    secure = getattr(settings, 'AUTH_COOKIE_SECURE', False)
    samesite = getattr(settings, 'AUTH_COOKIE_SAMESITE', 'Lax')
    
    response.set_cookie(
        'access_token',
        access_token,
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRY * 60,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path='/'
    )
    
    response.set_cookie(
        'refresh_token',
        refresh_token,
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRY * 24 * 60 * 60,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path='/api/auth/refresh/' # Refresh token is only sent to the refresh endpoint (plus root if needed, but let's just use / for simplicity so google callback and me work too)
    )
    # Actually, let's keep path='/' for refresh_token to avoid tricky path matching issues with different sub-routes
    response.set_cookie(
        'refresh_token',
        refresh_token,
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRY * 24 * 60 * 60,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path='/'
    )

def clear_auth_cookies(response):
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')
