from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_workspace, name='create_workspace'),
    path('join/', views.join_workspace, name='join_workspace'),
]
