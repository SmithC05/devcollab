import logging
import joblib
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
                model = joblib.load(model_path)
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
