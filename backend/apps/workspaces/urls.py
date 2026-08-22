from django.urls import path
from . import views

urlpatterns = [
    path('', views.workspaces_view, name='workspaces'),
    path('join/', views.join_workspace, name='join_workspace'),
]
