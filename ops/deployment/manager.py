from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum
from datetime import datetime
import json
from pathlib import Path


class DeploymentStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class Environment(Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


@dataclass
class DeploymentConfig:
    environment: Environment = Environment.DEVELOPMENT
    image_tag: str = "latest"
    replicas: int = 1
    resources: Dict[str, str] = field(default_factory=lambda: {
        "cpu": "500m",
        "memory": "512Mi"
    })
    autoscaling: bool = False
    health_check_path: str = "/api/health"
    readiness_check_path: str = "/api/health"


@dataclass
class Deployment:
    deployment_id: str
    name: str
    environment: Environment
    status: DeploymentStatus
    config: DeploymentConfig
    started_at: datetime
    completed_at: Optional[datetime] = None
    logs: List[str] = field(default_factory=list)
    error: Optional[str] = None


class DeploymentManager:
    def __init__(self, workspace_path: str = "ops/deployment/workspace"):
        self.workspace_path = Path(workspace_path)
        self.workspace_path.mkdir(parents=True, exist_ok=True)
        self.deployments: Dict[str, Deployment] = {}

    def create_deployment(self, name: str, config: DeploymentConfig) -> Deployment:
        deployment = Deployment(
            deployment_id=f"deploy_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            name=name,
            environment=config.environment,
            status=DeploymentStatus.PENDING,
            config=config,
            started_at=datetime.now()
        )
        
        self.deployments[deployment.deployment_id] = deployment
        return deployment

    def deploy(self, deployment_id: str) -> bool:
        deployment = self.deployments.get(deployment_id)
        if not deployment:
            return False
        
        deployment.status = DeploymentStatus.IN_PROGRESS
        deployment.logs.append(f"[{datetime.now().isoformat()}] Starting deployment {deployment_id}")
        
        try:
            self._execute_deployment(deployment)
            deployment.status = DeploymentStatus.COMPLETED
            deployment.completed_at = datetime.now()
            deployment.logs.append(f"[{datetime.now().isoformat()}] Deployment completed successfully")
            return True
        except Exception as e:
            deployment.status = DeploymentStatus.FAILED
            deployment.error = str(e)
            deployment.logs.append(f"[{datetime.now().isoformat()}] Deployment failed: {str(e)}")
            return False

    def _execute_deployment(self, deployment: Deployment):
        deployment.logs.append(f"[{datetime.now().isoformat()}] Building Docker image...")
        
        deployment.logs.append(f"[{datetime.now().isoformat()}] Pushing to registry...")
        
        deployment.logs.append(f"[{datetime.now().isoformat()}] Updating Kubernetes manifests...")
        
        deployment.logs.append(f"[{datetime.now().isoformat()}] Rolling out deployment with {deployment.config.replicas} replicas...")

    def rollback(self, deployment_id: str) -> bool:
        deployment = self.deployments.get(deployment_id)
        if not deployment:
            return False
        
        deployment.logs.append(f"[{datetime.now().isoformat()}] Rolling back deployment...")
        deployment.status = DeploymentStatus.ROLLED_BACK
        return True

    def get_deployment(self, deployment_id: str) -> Optional[Deployment]:
        return self.deployments.get(deployment_id)

    def list_deployments(self, environment: Optional[Environment] = None) -> List[Deployment]:
        if environment:
            return [d for d in self.deployments.values() if d.environment == environment]
        return list(self.deployments.values())

    def get_deployment_logs(self, deployment_id: str) -> List[str]:
        deployment = self.deployments.get(deployment_id)
        return deployment.logs if deployment else []


deployment_manager = DeploymentManager()
