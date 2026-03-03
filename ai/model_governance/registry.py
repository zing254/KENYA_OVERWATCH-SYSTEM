from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from datetime import datetime
from pathlib import Path
import json
import hashlib


@dataclass
class ModelMetadata:
    model_id: str
    name: str
    version: str
    model_type: str
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    metrics: Dict[str, Any] = field(default_factory=dict)
    parameters: Dict[str, Any] = field(default_factory=dict)
    description: str = ""
    author: str = ""
    status: str = "staging"
    file_path: Optional[str] = None
    checksum: Optional[str] = None
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "model_id": self.model_id,
            "name": self.name,
            "version": self.version,
            "model_type": self.model_type,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "accuracy": self.accuracy,
            "precision": self.precision,
            "recall": self.recall,
            "f1_score": self.f1_score,
            "metrics": self.metrics,
            "parameters": self.parameters,
            "description": self.description,
            "author": self.author,
            "status": self.status,
            "file_path": self.file_path,
            "checksum": self.checksum,
            "tags": self.tags
        }

    @classmethod
    def from_dict(cls, data: dict) -> "ModelMetadata":
        data = data.copy()
        data["created_at"] = datetime.fromisoformat(data.get("created_at", datetime.now().isoformat()))
        data["updated_at"] = datetime.fromisoformat(data.get("updated_at", datetime.now().isoformat()))
        return cls(**data)


class ModelRegistry:
    def __init__(self, storage_path: str = "data/models/registry"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.models: Dict[str, ModelMetadata] = {}
        self._load_registry()

    def _load_registry(self):
        registry_file = self.storage_path / "registry.json"
        if registry_file.exists():
            with open(registry_file, "r") as f:
                data = json.load(f)
                for model_data in data.get("models", []):
                    model = ModelMetadata.from_dict(model_data)
                    self.models[model.model_id] = model

    def _save_registry(self):
        registry_file = self.storage_path / "registry.json"
        data = {"models": [m.to_dict() for m in self.models.values()]}
        with open(registry_file, "w") as f:
            json.dump(data, f, indent=2)

    def register_model(self, metadata: ModelMetadata) -> ModelMetadata:
        if metadata.file_path:
            metadata.checksum = self._compute_checksum(metadata.file_path)
        
        self.models[metadata.model_id] = metadata
        self._save_registry()
        
        version_file = self.storage_path / f"{metadata.model_id}.json"
        with open(version_file, "w") as f:
            json.dump(metadata.to_dict(), f, indent=2)
        
        return metadata

    def get_model(self, model_id: str) -> Optional[ModelMetadata]:
        return self.models.get(model_id)

    def get_models_by_type(self, model_type: str) -> List[ModelMetadata]:
        return [m for m in self.models.values() if m.model_type == model_type]

    def get_models_by_status(self, status: str) -> List[ModelMetadata]:
        return [m for m in self.models.values() if m.status == status]

    def get_latest_version(self, name: str) -> Optional[ModelMetadata]:
        candidates = [m for m in self.models.values() if m.name == name]
        if not candidates:
            return None
        return max(candidates, key=lambda m: m.version)

    def update_model_status(self, model_id: str, status: str) -> Optional[ModelMetadata]:
        if model_id in self.models:
            self.models[model_id].status = status
            self.models[model_id].updated_at = datetime.now()
            self._save_registry()
            return self.models[model_id]
        return None

    def delete_model(self, model_id: str) -> bool:
        if model_id in self.models:
            del self.models[model_id]
            self._save_registry()
            
            version_file = self.storage_path / f"{model_id}.json"
            if version_file.exists():
                version_file.unlink()
            
            return True
        return False

    def _compute_checksum(self, file_path: str) -> str:
        path = Path(file_path)
        if not path.exists():
            return ""
        
        sha256_hash = hashlib.sha256()
        with open(path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        
        return sha256_hash.hexdigest()

    def list_all_models(self) -> List[ModelMetadata]:
        return list(self.models.values())
