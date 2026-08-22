import os
import joblib
import pandas as pd
import numpy as np
import xgboost as xgb

# Base directory for ML
ML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(ML_DIR, 'models')

# Load models lazily to prevent server crash on startup if pkl is corrupted
duration_preprocessor = None
duration_xgb_model = None
risk_model = None

def _load_duration_model():
    global duration_preprocessor, duration_xgb_model
    if duration_preprocessor is None or duration_xgb_model is None:
        try:
            duration_preprocessor = joblib.load(os.path.join(MODELS_DIR, 'duration_preprocessor.pkl'))
            duration_xgb_model = xgb.XGBRegressor()
            duration_xgb_model.load_model(os.path.join(MODELS_DIR, 'duration_xgb.json'))
        except Exception as e:
            raise RuntimeError(f"Failed to load duration preprocessor/xgb: {e}")

def _load_risk_model():
    global risk_model
    if risk_model is None:
        try:
            risk_model = joblib.load(os.path.join(MODELS_DIR, 'risk_model.pkl'))
        except Exception as e:
            raise RuntimeError(f"Failed to load risk_model.pkl: {e}")

def predict_duration(features: dict) -> float:
    """Predicts task duration in hours."""
    _load_duration_model()
    df = pd.DataFrame([features])
    
    X_transformed = duration_preprocessor.transform(df)
    log_pred = duration_xgb_model.predict(X_transformed)[0]
    
    # Reverse log1p using expm1
    pred = np.expm1(log_pred)
    
    # Clamp at >= 0
    if pred < 0:
        pred = 0.0
        
    return round(float(pred), 2)

def predict_risk(features: dict) -> tuple:
    """Predicts probability and risk class of execution rework."""
    _load_risk_model()
    df = pd.DataFrame([features])
    # predict_proba returns array of shape (1, 2). Class 1 is rework occurred.
    proba = risk_model.predict_proba(df)[0][1]
    # Finalized threshold 0.50
    risk_class = 1 if proba >= 0.50 else 0
    return round(float(proba), 2), risk_class
