from .context_score import calculate_context_score

def predict_risk(task_id: int, candidate_id: int, intervention_type: str) -> str:
    """
    Deterministic prototype for predicting the risk (rework risk, disruption risk) 
    of a particular intervention.
    
    Returns: 'LOW', 'MEDIUM', or 'HIGH'
    
    Later to be replaced by ML model (Random Forest / XGBoost).
    """
    context_score = calculate_context_score(task_id, candidate_id)
    
    if intervention_type == "WAIT":
        return "MEDIUM"
        
    elif intervention_type == "REASSIGN":
        if context_score < 0.5:
            return "HIGH"
        return "MEDIUM"
        
    elif intervention_type == "PAIR":
        return "LOW"
        
    elif intervention_type == "AI_ASSIST":
        if context_score < 0.4:
            return "MEDIUM"
        return "LOW"
        
    elif intervention_type == "PAIR_WITH_AI":
        return "LOW"
        
    elif intervention_type == "DE_SCOPE":
        return "MEDIUM"
        
    elif intervention_type == "PARALLELIZE":
        return "HIGH"
        
    return "MEDIUM"

def predict_deadline_probability(duration: float, deadline_days: float = 5.0) -> float:
    """
    Deterministic prototype to calculate the probability of hitting a deadline.
    Returns a probability 0.0 to 1.0.
    """
    if duration <= deadline_days * 0.8:
        return 0.95
    elif duration <= deadline_days:
        return 0.70
    elif duration <= deadline_days * 1.2:
        return 0.40
    else:
        return 0.10
