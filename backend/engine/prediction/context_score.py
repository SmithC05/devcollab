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
    # Dummy prototype logic:
    # We will simulate a score based on some mock rules, since we lack deep historical data.
    # E.g. User 1 has high context for everything, User 2 has low context.
    
    if candidate_id == 1:
        return 0.9  # High context for Smith
    elif candidate_id == 2:
        return 0.3  # Low project context for Rahul
    elif candidate_id == 3:
        return 0.6  # Medium context
    
    return 0.5
