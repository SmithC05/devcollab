import logging
import joblib
import xgboost as xgb
from pathlib import Path

logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parent

class ModelLoader:
    _models = {}
    
    METADATA = {
        "context_transfer": {
            "name": "context_transfer_model",
            "artifact": "context_transfer_model.pkl",
            "feature_version": "v1",
            "metrics": {
                "mae": 0.45,
                "r2": 0.82
            }
        },
        "knowledge_transfer": {
            "name": "knowledge_transfer_model",
            "artifact": "knowledge_transfer_model.pkl",
            "feature_version": "v1",
            "metrics": {
                "mae": 0.30,
                "r2": 0.79
            }
        },
        "duration": {
            "name": "duration_model",
            "artifact": "duration_xgb.json",
            "artifact_type": "xgboost",
            "preprocessor": "duration_preprocessor.pkl",
            "feature_version": "v1",
            "metrics": {}
        },
        "risk": {
            "name": "risk_model",
            "artifact": "risk_model.pkl",
            "artifact_type": "joblib",
            "feature_version": "v1",
            "metrics": {}
        }
    }

    @classmethod
    def get_model(cls, model_name: str):
        """
        Safely loads and caches a model by name.
        Raises FileNotFoundError if the model is missing.
        """
        if model_name not in cls.METADATA:
            raise ValueError(f"Unknown model: {model_name}")
            
        if model_name not in cls._models:
            metadata = cls.METADATA[model_name]
            model_path = BASE_DIR / "models" / metadata["artifact"]
            
            if not model_path.exists():
                logger.error(f"Failed to load ML model {model_name}: {model_path} does not exist.")
                raise FileNotFoundError(f"Missing ML artifact: {model_path}")
            
            try:
                artifact_type = metadata.get("artifact_type", "joblib")
                if artifact_type == "xgboost":
                    model = xgb.XGBRegressor()
                    model.load_model(model_path)
                else:
                    model = joblib.load(model_path)
                
                preprocessor = None
                if "preprocessor" in metadata:
                    prep_path = BASE_DIR / "models" / metadata["preprocessor"]
                    if prep_path.exists():
                        preprocessor = joblib.load(prep_path)
                    else:
                        logger.error(f"Missing preprocessor: {prep_path}")
                        raise FileNotFoundError(f"Missing preprocessor: {prep_path}")
                
                if preprocessor:
                    cls._models[model_name] = {"model": model, "preprocessor": preprocessor}
                else:
                    cls._models[model_name] = model
                    
                logger.info(f"Successfully loaded {model_name} from {model_path}")
            except Exception as e:
                logger.error(f"Failed to load ML model {model_name}: {str(e)}")
                raise
                
        return cls._models[model_name]

    @classmethod
    def get_metadata(cls, model_name: str) -> dict:
        if model_name not in cls.METADATA:
            raise ValueError(f"Unknown model: {model_name}")
        return cls.METADATA[model_name]
