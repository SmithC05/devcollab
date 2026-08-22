import json
import os
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .inference.core import predict_duration, predict_risk, ML_DIR

logger = logging.getLogger(__name__)

def validate_features(data, schema_file):
    schema_path = os.path.join(ML_DIR, 'models', schema_file)
    with open(schema_path, 'r') as f:
        schema = json.load(f)
        
    # Check all required features exist
    for feature in schema['input_features']:
        if feature not in data:
            return False, f"Missing required feature: {feature}"
            
    # Valid categories extracted from training data feature importance
    valid_categories = {
        'task_type': ['Documentation', 'Testing', 'Security', 'Integration', 'DevOps', 'Bug Fix', 'Database', 'Frontend', 'Feature', 'Refactoring', 'API', 'Backend'],
        'role': ['Admin', 'Dev', 'Lead', 'Senior Dev'],
        'task_priority': ['P0', 'P1', 'P2']
    }
    
    # Validate categorical features
    for cat_feature in schema.get('categorical_features', []):
        if cat_feature in data:
            val = data[cat_feature]
            if not isinstance(val, str):
                return False, f"Categorical feature '{cat_feature}' must be a string."
            if cat_feature in valid_categories and val not in valid_categories[cat_feature]:
                return False, f"Invalid categorical value for '{cat_feature}': '{val}'. Allowed: {valid_categories[cat_feature]}"
                
    # Validate numeric features
    for num_feature in schema.get('numeric_features', []):
        if num_feature in data:
            val = data[num_feature]
            if not isinstance(val, (int, float)):
                return False, f"Numeric feature '{num_feature}' must be a number."
                
    return True, ""

class DurationPredictionView(APIView):
    def post(self, request):
        is_valid, error_msg = validate_features(request.data, 'duration_feature_schema.json')
        if not is_valid:
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            hours = predict_duration(request.data)
            return Response({
                "predicted_hours": hours,
                "model_version": "duration_v1"
            })
        except Exception as e:
            logger.error(f"Duration model failed: {e}")
            return Response({"error": "Duration model unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class RiskPredictionView(APIView):
    def post(self, request):
        is_valid, error_msg = validate_features(request.data, 'risk_feature_schema.json')
        if not is_valid:
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            prob, risk_class = predict_risk(request.data)
            return Response({
                "risk_probability": prob,
                "risk_class": risk_class,
                "model_version": "risk_v1"
            })
        except Exception as e:
            logger.error(f"Risk model failed: {e}")
            return Response({"error": "Risk model unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
