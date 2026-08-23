import pandas as pd
from .loader import ModelLoader
from .feature_builder import build_context_transfer_features, build_knowledge_transfer_features

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