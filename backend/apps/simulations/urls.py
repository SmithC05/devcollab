from django.urls import path
from .views import evaluate_scenario, approve_scenario

urlpatterns = [
    path('evaluate/', evaluate_scenario, name='evaluate-scenario'),
    path('<int:scenario_id>/approve/', approve_scenario, name='approve-scenario'),
]
