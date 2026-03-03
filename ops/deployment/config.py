from dataclasses import dataclass
from typing import Dict


@dataclass
class DeploymentOrchestratorConfig:
    workspace_path: str = "ops/deployment/workspace"
    docker_registry: str = "gcr.io/kenya-overwatch"
    kubernetes_namespace: str = "kenya-overwatch"
    enable_rollback: bool = True
    max_retries: int = 3
    timeout_seconds: int = 300


__all__ = ["DeploymentOrchestratorConfig"]
