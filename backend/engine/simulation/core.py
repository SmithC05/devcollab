from engine.prediction.context_score import calculate_context_score
from engine.prediction.duration import predict_duration
from engine.prediction.risk import predict_risk, predict_deadline_probability

def simulate_intervention(task_id: int, candidate_id: int, intervention_type: str) -> dict:
    """
    Simulates the outcome of applying a specific intervention.
    """
    duration = predict_duration(task_id, candidate_id, intervention_type)
    risk_level = predict_risk(task_id, candidate_id, intervention_type)
    deadline_prob = predict_deadline_probability(duration)
    context_score = calculate_context_score(task_id, candidate_id)
    
    # Generate some structured reasoning for transparency
    reasons = []
    
    if context_score < 0.5:
        reasons.append(f"Candidate has low project/task context ({int(context_score*100)}%).")
    else:
        reasons.append(f"Candidate has good project/task context ({int(context_score*100)}%).")
        
    if intervention_type == "WAIT":
        reasons.append("Waiting incurs no transfer cost but adds dead time to delivery.")
    elif intervention_type == "REASSIGN":
        reasons.append("Direct reassignment incurs full transfer cost/ramp-up time.")
    elif intervention_type == "PAIR" or intervention_type == "PAIR_WITH_AI":
        reasons.append("Pairing mitigates transfer cost and reduces overall risk.")
    elif intervention_type == "AI_ASSIST":
        reasons.append("AI Assist speeds up execution but ramp-up is still required for new developers.")
    elif intervention_type == "DE_SCOPE":
        reasons.append("De-scoping reduces base duration significantly.")
        
    return {
        "type": intervention_type,
        "score": context_score,
        "estimated_completion": round(duration, 1),
        "risk": risk_level,
        "deadline_probability": round(deadline_prob, 2),
        "reason": reasons
    }

def run_simulation(task_id: int, candidate_id: int) -> list:
    """
    Runs a simulation across all valid intervention types for a given candidate.
    """
    interventions = [
        "WAIT", 
        "REASSIGN", 
        "PAIR", 
        "AI_ASSIST", 
        "PAIR_WITH_AI", 
        "DE_SCOPE", 
        "PARALLELIZE"
    ]
    
    results = []
    for intervention in interventions:
        results.append(simulate_intervention(task_id, candidate_id, intervention))
        
    return results
