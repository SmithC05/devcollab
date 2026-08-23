import os

with open("e:/Innofusion/devcollab/backend/apps/intelligence/views.py", "a") as f:
    f.write("""
from rest_framework.decorators import api_view
from apps.tasks.models import Task
from apps.integrations.evidence import get_developer_context
from django.shortcuts import get_object_or_404
from .capacity import calculate_capacity

@api_view(['GET'])
def compare_task_candidates(request):
    task_id = request.GET.get('task_id')
    if not task_id:
        return Response({"error": "task_id required"}, status=400)
    
    task = get_object_or_404(Task, id=task_id)
    
    eligible_users = User.objects.filter(role__in=['DEVELOPER', 'LEAD', 'OWNER'])
    all_tasks = Task.objects.all()
    
    candidates = []
    for u in eligible_users:
        if "admin" in u.email: continue
        
        cap_data = calculate_capacity(u, all_tasks)
        features, provenance, explanations = get_developer_context(task, u)
        
        score = (features.get("repository_familiarity") or 0.0) * 0.4 + \
                (features.get("project_familiarity") or 0.0) * 0.4 + \
                (features.get("technology_familiarity") or 0.0) * 0.2
        
        context_level = "HIGH" if score > 0.6 else "MEDIUM" if score > 0.3 else "LOW"
        
        evidence_arr = [{"feature": k, "value": features[k], "provenance": provenance[k], "explanation": explanations[k]} for k in features]
        
        candidates.append({
            "developer": {"id": u.id, "name": u.get_full_name() or u.username, "email": u.email, "role": u.role},
            "capacity": cap_data,
            "context": {"level": context_level, "score": score},
            "features": features,
            "provenance": provenance,
            "evidence": evidence_arr
        })
        
    return Response({
        "task": {"id": task.id, "title": task.title, "project_name": task.project.name},
        "candidates": candidates
    })

@api_view(['GET'])
def get_member_evidence(request, pk):
    task_id = request.GET.get('task_id')
    member = get_object_or_404(User, id=pk)
    
    task = get_object_or_404(Task, id=task_id) if task_id else None
    
    all_tasks = Task.objects.all()
    cap_data = calculate_capacity(member, all_tasks)
    
    features, provenance, explanations = {}, {}, {}
    evidence_arr = []
    if task:
        features, provenance, explanations = get_developer_context(task, member)
        evidence_arr = [{"feature": k, "value": features[k], "provenance": provenance[k], "explanation": explanations[k]} for k in features]
    
    ai_summary = "AI Summary temporarily unavailable."
    
    return Response({
        "developer": {"id": member.id, "name": member.get_full_name() or member.username},
        "capacity": cap_data,
        "features": features,
        "provenance": provenance,
        "evidence": evidence_arr,
        "ai_summary": ai_summary
    })
""")

print("Appended views successfully")
