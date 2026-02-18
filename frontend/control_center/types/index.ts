export interface Coordinates {
  lat: number
  lng: number
  altitude?: number
  accuracy?: number
}

export interface DetectionEvent {
  camera_id: string
  timestamp: string
  detection_type: string
  confidence: number
  bounding_box: { x: number; y: number; w: number; h: number }
  attributes: Record<string, any>
  frame_hash: string
  model_version: string
}

export interface RiskFactors {
  temporal_risk: number
  spatial_risk: number
  behavioral_risk: number
  contextual_risk: number
  reason_codes: string[]
}

export interface RiskAssessment {
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  factors: RiskFactors
  recommended_action: string
  confidence: number
  timestamp: string
}

export interface EvidencePackage {
  id: string
  incident_id: string
  created_at: string
  events: DetectionEvent[]
  risk_assessment: RiskAssessment
  metadata: Record<string, any>
  status: 'created' | 'under_review' | 'approved' | 'rejected' | 'appealed' | 'archived'
  reviewer_id?: string
  review_notes?: string
  appeal_status?: string
  retention_until?: string
  package_hash: string
}

export interface ProductionIncident {
  id: string
  type: string
  title: string
  description: string
  location: string
  coordinates: Coordinates
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'responding' | 'resolved' | 'monitoring' | 'under_review'
  risk_assessment: RiskAssessment
  evidence_packages: EvidencePackage[]
  created_at: string
  updated_at?: string
  reported_by: string
  assigned_team_id?: string
  requires_human_review: boolean
  human_review_completed: boolean
  appeal_deadline?: string
}

export interface SystemMetrics {
  ai_pipeline: {
    fps: number
    detection_accuracy: number
    false_positive_rate: number
    processing_latency_ms: number
  }
  risk_engine: {
    assessments_per_hour: number
    high_risk_accuracy: number
    average_response_time_minutes: number
  }
  evidence_system: {
    packages_created_today: number
    review_completion_rate: number
    appeal_success_rate: number
  }
  system: {
    uptime_percentage: number
    data_integrity_score: number
    audit_log_completeness: number
  }
}

export interface Alert {
  id: string
  type: string
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  camera_id?: string
  risk_score?: number
  acknowledged: boolean
  requires_action: boolean
  created_at: string
}

export interface Camera {
  id: string
  name: string
  location: string
  coordinates: Coordinates
  status: 'online' | 'offline' | 'maintenance'
  ai_enabled: boolean
  ai_models: string[]
  resolution: string
  fps: number
  risk_score: number
  detections_last_hour: number
  last_frame: string
}

export interface User {
  id: string
  username: string
  email: string
  role: 'operator' | 'supervisor' | 'admin'
  permissions: string[]
  last_login: string
  active: boolean
}

export interface ResponseTeam {
  id: string
  name: string
  type: 'police' | 'medical' | 'fire' | 'security'
  status: 'available' | 'deployed' | 'unavailable'
  location: string
  contact: string
  members: number
  equipment: string[]
  current_incident_id?: string
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  user_id?: string
}

export interface DashboardStats {
  incidents: {
    total: number
    active: number
    high_risk: number
    pending_reviews: number
  }
  evidence: {
    total_packages: number
    pending_review: number
    approved: number
    appealed: number
  }
  system: {
    cameras_online: number
    ai_models_active: number
    risk_alerts_today: number
    system_health: string
  }
  timestamp: string
}

export type MilestoneStatus = 'draft' | 'in_progress' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled'
export type MilestoneType = 'development' | 'incident_case' | 'evidence_review'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface Milestone {
  id: string
  title: string
  description: string
  type: MilestoneType
  status: MilestoneStatus
  priority: Priority
  created_by: string
  assigned_to?: string
  approved_by?: string
  created_at: string
  updated_at?: string
  due_date?: string
  completed_at?: string
  submitted_for_approval_at?: string
  linked_incident_id?: string
  linked_evidence_id?: string
  approval_notes?: string
  rejection_reason?: string
}