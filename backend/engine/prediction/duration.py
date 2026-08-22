from .context_score import calculate_context_score

def predict_duration(task_id: int, candidate_id: int, intervention_type: str) -> float:
    """
    Deterministic prototype for predicting task duration (in days) given an intervention.
    
    Later to be replaced by ML model using:
    - task complexity
    - progress already completed
    - dependency count
    - current workload
    """
    
    # Base estimated remaining work (prototype logic)
    base_duration = 3.0  # Assumes 3 days left on the task
    
    context_score = calculate_context_score(task_id, candidate_id)
    
    # Transfer cost formula: complexity * (1 - context_score) * base_transfer_factor
    # The less context they have, the higher the transfer cost
    transfer_cost = 2.0 * (1.0 - context_score)
    
    if intervention_type == "WAIT":
        # Waiting just adds the wait duration (simulated as 3 days) + base duration
        return base_duration + 3.0
    
    elif intervention_type == "REASSIGN":
        # Reassignment incurs the full transfer cost
        return base_duration + transfer_cost
        
    elif intervention_type == "PAIR":
        # Pairing with AI or someone else reduces base duration but incurs a small ramp-up
        return (base_duration * 0.7) + (transfer_cost * 0.5)
        
    elif intervention_type == "AI_ASSIST":
        # AI assist speeds up base duration but transfer cost remains if the dev is new
        return (base_duration * 0.6) + (transfer_cost * 0.8)
        
    elif intervention_type == "PAIR_WITH_AI":
        # Represents PAIR + AI ASSIST combined
        return (base_duration * 0.5) + (transfer_cost * 0.4)
        
    elif intervention_type == "DE_SCOPE":
        # Reduce scope, reduce base duration significantly, but still has some transfer cost
        return (base_duration * 0.4) + transfer_cost
        
    elif intervention_type == "PARALLELIZE":
        # Split task, reducing duration slightly but adding coordination overhead
        return (base_duration * 0.8) + transfer_cost + 1.0

    return base_duration + transfer_cost
