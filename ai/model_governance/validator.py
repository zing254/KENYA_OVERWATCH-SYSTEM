from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import numpy as np
import time


@dataclass
class ValidationResult:
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    metrics: Dict[str, Any]
    validated_at: float


class ModelValidator:
    def __init__(self):
        self.validation_history: Dict[str, List[ValidationResult]] = {}

    def validate_model(self, model: Any, test_data: Optional[np.ndarray] = None) -> ValidationResult:
        errors = []
        warnings = []
        metrics = {}

        if model is None:
            errors.append("Model is None")
            return ValidationResult(
                is_valid=False,
                errors=errors,
                warnings=warnings,
                metrics=metrics,
                validated_at=time.time()
            )

        metrics["model_type"] = type(model).__name__
        metrics["has_predict_method"] = hasattr(model, "predict") or hasattr(model, "__call__")
        
        if test_data is not None:
            try:
                if hasattr(model, "predict"):
                    predictions = model.predict(test_data)
                elif hasattr(model, "__call__"):
                    predictions = model(test_data)
                else:
                    predictions = None
                
                if predictions is not None:
                    metrics["prediction_shape"] = predictions.shape if hasattr(predictions, "shape") else "unknown"
                    metrics["test_execution_success"] = True
                else:
                    warnings.append("Model produced None prediction")
                    metrics["test_execution_success"] = False
            except Exception as e:
                errors.append(f"Test execution failed: {str(e)}")
                metrics["test_execution_success"] = False
        else:
            warnings.append("No test data provided, skipping inference test")

        is_valid = len(errors) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            metrics=metrics,
            validated_at=time.time()
        )

    def validate_input_shape(self, model: Any, expected_shape: tuple) -> ValidationResult:
        errors = []
        warnings = []
        metrics = {"expected_shape": expected_shape}

        if not hasattr(model, "input_shape") and not hasattr(model, "img_size"):
            warnings.append("Model does not expose input shape")
            return ValidationResult(
                is_valid=True,
                errors=errors,
                warnings=warnings,
                metrics=metrics,
                validated_at=time.time()
            )

        if hasattr(model, "input_shape"):
            actual_shape = model.input_shape
            metrics["actual_shape"] = actual_shape
            
            if actual_shape != expected_shape:
                errors.append(f"Input shape mismatch: expected {expected_shape}, got {actual_shape}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            metrics=metrics,
            validated_at=time.time()
        )

    def check_model_drift(self, current_metrics: Dict[str, float], baseline_metrics: Dict[str, float], threshold: float = 0.1) -> Dict[str, Any]:
        drift_results = {}
        
        for metric_name in baseline_metrics:
            if metric_name in current_metrics:
                baseline = baseline_metrics[metric_name]
                current = current_metrics[metric_name]
                
                if baseline != 0:
                    relative_change = abs(current - baseline) / baseline
                    drift_results[metric_name] = {
                        "baseline": baseline,
                        "current": current,
                        "relative_change": relative_change,
                        "drifted": relative_change > threshold
                    }
        
        return drift_results
