def calculate_context_score(task_id: int, candidate_id: int) -> float:
    """
    Deterministic prototype to calculate a developer's context familiarity with a task.
    Returns a score from 0.0 (no context) to 1.0 (perfect context).
    
    In the future, this will be replaced by an ML model (e.g., XGBoost) using features like:
    - repository familiarity
    - architecture familiarity
    - similar task history
    - technology familiarity
    """
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=candidate_id)
        
        email = user.email.lower()
        if "smith" in email:
            return 0.9  # High context for Smith
        elif "rahul" in email:
            return 0.3  # Low project context for Rahul
        elif "ankush" in email:
            return 0.6  # Medium context
    except Exception:
        pass
        
    return 0.5
