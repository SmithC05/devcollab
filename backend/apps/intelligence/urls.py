from django.urls import path
from .views import EngineeringCommandCenterView

urlpatterns = [
    path('command-center/', EngineeringCommandCenterView.as_view(), name='engineering-command-center'),
]
