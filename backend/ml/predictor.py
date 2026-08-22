import pandas as pd
import numpy as np
from .loader import ModelLoader
from .feature_builder import build_context_transfer_features, build_knowledge_transfer_features, build_duration_risk_features

def _strip_provenance(features: dict) -> dict:
    """
    Returns a copy of the features dictionary ready for inference.
    Does nothing right now because feature builder separates provenance,
    but this ensures we never leak internal metadata if they were merged.
    """
    return features.copy()

def predict_context_transfer(task, candidate) -> dict:
    """
    Predicts the context transfer effort in hours.
    Returns structured metadata including the model version.
    """
    model = ModelLoader.get_model("context_transfer")
    metadata = ModelLoader.get_metadata("context_transfer")
    
    features, provenance = build_context_transfer_features(task, candidate)
    inference_payload = _strip_provenance(features)
    
    # Sklearn pipelines trained on DataFrames expect DataFrames for inference
    df = pd.DataFrame([inference_payload])
    
    predicted_hours = float(model.predict(df)[0])
    
    return {
        "model": metadata["name"],
        "feature_version": metadata["feature_version"],
        "prediction_hours": round(predicted_hours, 2),
        "provenance": provenance
    }

def predict_knowledge_transfer(task, candidate) -> dict:
    """
    Predicts the reduction in transfer effort (hours) from a structured knowledge handoff.
    """
    model = ModelLoader.get_model("knowledge_transfer")
    metadata = ModelLoader.get_metadata("knowledge_transfer")
    
    features, provenance = build_knowledge_transfer_features(task, candidate)
    inference_payload = _strip_provenance(features)
    
    df = pd.DataFrame([inference_payload])
    
    predicted_reduction_hours = float(model.predict(df)[0])
    
    return {
        "model": metadata["name"],
        "feature_version": metadata["feature_version"],
        "predicted_reduction_hours": round(predicted_reduction_hours, 2),
        "provenance": provenance
    }

def predict_duration(task, candidate, intervention: str = "WAIT") -> float:
    """Predicts task duration in hours."""
    model_data = ModelLoader.get_model("duration")
    model = model_data["model"]
    preprocessor = model_data["preprocessor"]
    
    features, provenance = build_duration_risk_features(task, candidate, intervention)
    inference_payload = _strip_provenance(features)
    
    df = pd.DataFrame([inference_payload])
    X_transformed = preprocessor.transform(df)
    log_pred = model.predict(X_transformed)[0]
    
    pred = np.expm1(log_pred)
    if pred < 0:
        pred = 0.0
        
    return round(float(pred), 2)

def predict_risk(task, candidate, intervention: str = "WAIT") -> tuple:
    """Predicts probability and risk class of execution rework."""
    model = ModelLoader.get_model("risk")
    
    features, provenance = build_duration_risk_features(task, candidate, intervention)
    inference_payload = _strip_provenance(features)
    
    df = pd.DataFrame([inference_payload])
    proba = model.predict_proba(df)[0][1]
    risk_class = 1 if proba >= 0.50 else 0
    
    return round(float(proba), 2), risk_class