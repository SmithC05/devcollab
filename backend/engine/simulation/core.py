from engine.prediction.context_score import calculate_context_score
from engine.prediction.risk import predict_deadline_probability
from ml.predictor import predict_context_transfer, predict_knowledge_transfer, predict_duration, predict_risk
from apps.tasks.models import Task
from django.contrib.auth import get_user_model

User = get_user_model()

def simulate_intervention(task_id: int, candidate_id: int, intervention_type: str) -> dict:
    """
    Simulates the outcome of applying a specific intervention.
    Integrates ML predictions for context transfer and knowledge transfer.
    """
    try:
        task = Task.objects.get(id=task_id)
        candidate = User.objects.get(id=candidate_id)
    except (Task.DoesNotExist, User.DoesNotExist):
        return {"error": "Invalid task or candidate ID"}

    try:
        duration = predict_duration(task, candidate, intervention_type)
    except Exception as e:
        duration = 0.0

    try:
        risk_prob, risk_class = predict_risk(task, candidate, intervention_type)
        risk_level = "HIGH" if risk_class == 1 else ("LOW" if risk_prob < 0.25 else "MEDIUM")
    except Exception as e:
        risk_level = "UNKNOWN"
        risk_prob = 0.0
    
    deadline_prob = predict_deadline_probability(duration)
    context_score = calculate_context_score(task_id, candidate_id)
    
    # Generate structured reasoning for transparency
    reasons = []
    
    if context_score < 0.5:
        reasons.append(f"Candidate has low project/task context ({int(context_score*100)}%).")
    else:
        reasons.append(f"Candidate has good project/task context ({int(context_score*100)}%).")
        
    # ML Integration
    transfer_effort = 0.0
    transfer_reduction = 0.0
    
    # We predict context transfer for relevant interventions
    if intervention_type in ["REASSIGN", "PAIR", "KNOWLEDGE_TRANSFER"]:
        try:
            ctx_pred = predict_context_transfer(task, candidate)
            transfer_effort = ctx_pred.get("prediction_hours", 0.0)
            reasons.append(f"Predicted base context transfer effort: {transfer_effort}h.")
        except Exception as e:
            reasons.append(f"Failed to predict transfer effort: {e}")

    if intervention_type == "KNOWLEDGE_TRANSFER":
        try:
            kt_pred = predict_knowledge_transfer(task, candidate)
            transfer_reduction = kt_pred.get("predicted_reduction_hours", 0.0)
            reasons.append(f"Predicted effort reduction from knowledge handoff: {transfer_reduction}h.")
            
            # The net transfer effort is the base minus the reduction
            net_effort = max(0.0, transfer_effort - transfer_reduction)
            reasons.append(f"Net post-handoff transfer effort: {round(net_effort, 1)}h.")
            # Factor this into the duration/risk in a real deterministic engine
            duration += net_effort
            
        except Exception as e:
            reasons.append(f"Failed to predict knowledge transfer reduction: {e}")
            
    elif intervention_type == "REASSIGN":
        reasons.append("Direct reassignment incurs full transfer cost/ramp-up time.")
        duration += transfer_effort
        
    elif intervention_type == "WAIT":
        reasons.append("Waiting incurs no transfer cost but adds dead time to delivery.")
        
    elif intervention_type in ["PAIR", "PAIR_WITH_AI"]:
        reasons.append("Pairing mitigates transfer cost and reduces overall risk.")
        # In a real engine, PAIR mitigates but doesn't eliminate transfer effort
        duration += transfer_effort * 0.5 
        
    elif intervention_type == "AI_ASSIST":
        reasons.append("AI Assist speeds up execution but ramp-up is still required for new developers.")
        
    elif intervention_type == "DE_SCOPE":
        reasons.append("De-scoping reduces base duration significantly.")
        duration = duration * 0.5
        
    return {
        "type": intervention_type,
        "score": context_score,
        "estimated_completion": round(duration, 1),
        "risk": risk_level,
        "deadline_probability": round(deadline_prob, 2),
        "predicted_transfer_effort_hours": round(transfer_effort, 2) if transfer_effort else None,
        "predicted_transfer_effort_reduction_hours": round(transfer_reduction, 2) if transfer_reduction else None,
        "reason": reasons,
        "predicted_remaining_hours": round(duration, 1),
        "risk_probability": round(risk_prob, 2),
        "risk_class": risk_class
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
        "PARALLELIZE",
        "KNOWLEDGE_TRANSFER"
    ]
    
    results = []
    for intervention in interventions:
        results.append(simulate_intervention(task_id, candidate_id, intervention))
        
    return results
