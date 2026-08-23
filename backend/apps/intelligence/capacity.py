from apps.tasks.models import Task
from django.utils import timezone
from datetime import timedelta

def calculate_capacity(user, all_tasks=None):
    if all_tasks is None:
        user_tasks = Task.objects.filter(assignee=user).exclude(status=Task.StatusChoices.DONE)
    else:
        user_tasks = all_tasks.filter(assignee=user).exclude(status=Task.StatusChoices.DONE)
        
    active_tasks = user_tasks.count()
    critical_tasks = user_tasks.filter(priority=Task.PriorityChoices.P0).count()
    high_tasks = user_tasks.filter(priority=Task.PriorityChoices.P1).count()
    
    # Calculate a deterministic workload score.
    # P0 = 40 points
    # P1 = 25 points
    # P2 = 15 points
    # P3 = 10 points
    
    workload = 0
    for t in user_tasks:
        if t.priority == 'P0': workload += 40
        elif t.priority == 'P1': workload += 25
        elif t.priority == 'P2': workload += 15
        else: workload += 10
        
    # Cap at 100
    capacity_pct = min(100, workload)
    
    if capacity_pct >= 85:
        availability = "OVERLOADED"
    elif capacity_pct >= 55:
        availability = "BUSY"
    elif capacity_pct >= 15:
        availability = "AVAILABLE"
    else:
        availability = "IDLE"
        
    return {
        "capacity_pct": capacity_pct,
        "availability": availability,
        "active_task_count": active_tasks,
        "critical_task_count": critical_tasks,
        "workload_score": workload
    }
