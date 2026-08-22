from django.urls import path
from .views import DurationPredictionView, RiskPredictionView

urlpatterns = [
    path('duration/', DurationPredictionView.as_view(), name='ml-duration'),
    path('risk/', RiskPredictionView.as_view(), name='ml-risk'),
]
