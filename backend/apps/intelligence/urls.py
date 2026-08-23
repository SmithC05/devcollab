from django.urls import path
from .views import EngineeringCommandCenterView, DecisionPointDetailView

urlpatterns = [
    path('command-center/', EngineeringCommandCenterView.as_view(), name='engineering-command-center'),
    path('decision/<str:dp_id>/', DecisionPointDetailView.as_view(), name='decision-point-detail'),
]
