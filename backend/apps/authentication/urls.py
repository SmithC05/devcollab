from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me_view, name='me'),
    path('refresh/', views.refresh_view, name='refresh'),
    path('oauth/callback/', views.oauth_callback_view, name='oauth_callback'),
]
