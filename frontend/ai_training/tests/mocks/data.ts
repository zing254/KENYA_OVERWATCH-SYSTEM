// Mock data for testing

export const mockIncidents = [
  {
    id: 'incident_001',
    type: 'security_threat',
    title: 'Unauthorized Access Detected - North Gate',
    description: 'AI detected unauthorized individual attempting to access restricted area',
    location: 'Nairobi CBD - North Gate',
    coordinates: { lat: -1.2921, lng: 36.8219 },
    severity: 'high',
    status: 'active',
    risk_assessment: {
      risk_score: 0.85,
      risk_level: 'high',
      factors: {
        temporal_risk: 0.6,
        spatial_risk: 0.9,
        behavioral_risk: 0.8,
        contextual_risk: 0.4,
        reason_codes: ['BEHAVIORAL_ANOMALY', 'HIGH_RISK_LOCATION', 'AFTER_HOURS']
      },
      recommended_action: 'Immediate human response',
      confidence: 0.92,
      timestamp: '2024-01-15T10:30:00Z'
    },
    evidence_packages: [
      {
        id: 'evidence_001',
        incident_id: 'incident_001',
        created_at: '2024-01-15T10:31:00Z',
        events: [
          {
            camera_id: 'cam_north_gate',
            timestamp: '2024-01-15T10:30:15Z',
            detection_type: 'person',
            confidence: 0.95,
            bounding_box: { x: 120, y: 80, w: 60, h: 120 },
            attributes: {
              pose: 'walking',
              clothing_color: 'dark',
              estimated_height: '1.75m'
            },
            frame_hash: 'abc123...',
            model_version: '1.2.0'
          }
        ],
        risk_assessment: {
          risk_score: 0.85,
          risk_level: 'high',
          factors: {
            temporal_risk: 0.6,
            spatial_risk: 0.9,
            behavioral_risk: 0.8,
            contextual_risk: 0.4,
            reason_codes: ['BEHAVIORAL_ANOMALY']
          },
          recommended_action: 'Immediate human response',
          confidence: 0.92,
          timestamp: '2024-01-15T10:31:00Z'
        },
        metadata: {
          created_by: 'AI_System',
          camera_calibrations: {
            lens_distortion: 'calibrated',
            gps_accuracy: '±2m',
            timestamp_sync: 'NTP synced'
          },
          system_version: '2.0.0'
        },
        status: 'under_review',
        package_hash: 'sha256_hash_001'
      }
    ],
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:35:00Z',
    reported_by: 'AI_System',
    requires_human_review: true,
    human_review_completed: false,
    appeal_deadline: '2024-02-14T10:30:00Z'
  },
  {
    id: 'incident_002',
    type: 'traffic_violation',
    title: 'Vehicle Speeding - Main Entrance',
    description: 'Vehicle detected exceeding speed limit in restricted zone',
    location: 'Nairobi CBD - Main Entrance',
    coordinates: { lat: -1.2925, lng: 36.8225 },
    severity: 'medium',
    status: 'responding',
    risk_assessment: {
      risk_score: 0.65,
      risk_level: 'medium',
      factors: {
        temporal_risk: 0.4,
        spatial_risk: 0.7,
        behavioral_risk: 0.6,
        contextual_risk: 0.3,
        reason_codes: ['SPEED_VIOLATION', 'RESTRICTED_ZONE']
      },
      recommended_action: 'Operator notification',
      confidence: 0.88,
      timestamp: '2024-01-15T11:15:00Z'
    },
    evidence_packages: [],
    created_at: '2024-01-15T11:15:00Z',
    reported_by: 'AI_System',
    requires_human_review: false,
    human_review_completed: false
  },
  {
    id: 'incident_003',
    type: 'public_safety',
    title: 'Crowd Formation Alert',
    description: 'Unusual crowd density detected in public square',
    location: 'Nairobi CBD - Central Square',
    coordinates: { lat: -1.2915, lng: 36.8215 },
    severity: 'low',
    status: 'monitoring',
    risk_assessment: {
      risk_score: 0.35,
      risk_level: 'low',
      factors: {
        temporal_risk: 0.2,
        spatial_risk: 0.4,
        behavioral_risk: 0.3,
        contextual_risk: 0.2,
        reason_codes: ['CROWD_DENSITY', 'NORMAL_HOURS']
      },
      recommended_action: 'Log only',
      confidence: 0.75,
      timestamp: '2024-01-15T12:00:00Z'
    },
    evidence_packages: [],
    created_at: '2024-01-15T12:00:00Z',
    reported_by: 'AI_System',
    requires_human_review: false,
    human_review_completed: false
  }
]

export const mockAlerts = [
  {
    id: 'alert_001',
    type: 'high_risk_incident',
    title: 'High Risk Behavior Detected',
    message: 'Suspicious loitering detected in restricted zone',
    severity: 'high',
    camera_id: 'cam_north_gate',
    risk_score: 0.78,
    acknowledged: false,
    requires_action: true,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'alert_002',
    type: 'system_health',
    title: 'Camera Offline',
    message: 'Camera cam_south_entrance is not responding',
    severity: 'medium',
    camera_id: 'cam_south_entrance',
    acknowledged: false,
    requires_action: true,
    created_at: '2024-01-15T11:45:00Z'
  },
  {
    id: 'alert_003',
    type: 'evidence_review',
    title: 'Evidence Requires Review',
    message: 'New evidence package needs human review',
    severity: 'low',
    acknowledged: false,
    requires_action: false,
    created_at: '2024-01-15T12:30:00Z'
  }
]

export const mockSystemMetrics = {
  ai_pipeline: {
    fps: 29.8,
    detection_accuracy: 0.94,
    false_positive_rate: 0.02,
    processing_latency_ms: 45
  },
  risk_engine: {
    assessments_per_hour: 156,
    high_risk_accuracy: 0.89,
    average_response_time_minutes: 3.2
  },
  evidence_system: {
    packages_created_today: 24,
    review_completion_rate: 0.92,
    appeal_success_rate: 0.15
  },
  system: {
    uptime_percentage: 99.98,
    data_integrity_score: 1.0,
    audit_log_completeness: 1.0
  }
}

export const mockCameras = [
  {
    id: 'cam_north_gate',
    name: 'North Gate - AI Enhanced',
    location: 'Nairobi CBD North Gate',
    coordinates: { lat: -1.2921, lng: 36.8219 },
    status: 'online',
    ai_enabled: true,
    ai_models: ['person_detection', 'vehicle_detection', 'behavior_analysis'],
    resolution: '1920x1080',
    fps: 30,
    risk_score: 0.45,
    detections_last_hour: 127,
    last_frame: '2024-01-15T12:35:00Z'
  },
  {
    id: 'cam_main_entrance',
    name: 'Main Entrance - High Resolution',
    location: 'Nairobi CBD Main Entrance',
    coordinates: { lat: -1.2925, lng: 36.8225 },
    status: 'online',
    ai_enabled: true,
    ai_models: ['person_detection', 'vehicle_detection', 'anpr'],
    resolution: '4K (3840x2160)',
    fps: 25,
    risk_score: 0.32,
    detections_last_hour: 89,
    last_frame: '2024-01-15T12:35:00Z'
  },
  {
    id: 'cam_south_entrance',
    name: 'South Entrance - Standard',
    location: 'Nairobi CBD South Entrance',
    coordinates: { lat: -1.2915, lng: 36.8210 },
    status: 'offline',
    ai_enabled: false,
    ai_models: [],
    resolution: '1920x1080',
    fps: 30,
    risk_score: 0.0,
    detections_last_hour: 0,
    last_frame: '2024-01-15T11:45:00Z'
  },
  {
    id: 'cam_central_square',
    name: 'Central Square - Wide Angle',
    location: 'Nairobi CBD Central Square',
    coordinates: { lat: -1.2915, lng: 36.8215 },
    status: 'online',
    ai_enabled: true,
    ai_models: ['person_detection', 'crowd_analysis'],
    resolution: '1920x1080',
    fps: 30,
    risk_score: 0.28,
    detections_last_hour: 203,
    last_frame: '2024-01-15T12:35:00Z'
  }
]

export const mockEvidencePackages = [
  {
    id: 'evidence_001',
    incident_id: 'incident_001',
    created_at: '2024-01-15T10:31:00Z',
    events: [
      {
        camera_id: 'cam_north_gate',
        timestamp: '2024-01-15T10:30:15Z',
        detection_type: 'person',
        confidence: 0.95,
        bounding_box: { x: 120, y: 80, w: 60, h: 120 },
        attributes: {
          pose: 'walking',
          clothing_color: 'dark',
          estimated_height: '1.75m'
        },
        frame_hash: 'abc123...',
        model_version: '1.2.0'
      },
      {
        camera_id: 'cam_north_gate',
        timestamp: '2024-01-15T10:30:30Z',
        detection_type: 'person',
        confidence: 0.92,
        bounding_box: { x: 140, y: 85, w: 58, h: 115 },
        attributes: {
          pose: 'standing',
          clothing_color: 'dark',
          estimated_height: '1.73m'
        },
        frame_hash: 'def456...',
        model_version: '1.2.0'
      }
    ],
    risk_assessment: {
      risk_score: 0.85,
      risk_level: 'high',
      factors: {
        temporal_risk: 0.6,
        spatial_risk: 0.9,
        behavioral_risk: 0.8,
        contextual_risk: 0.4,
        reason_codes: ['BEHAVIORAL_ANOMALY', 'HIGH_RISK_LOCATION']
      },
      recommended_action: 'Immediate human response',
      confidence: 0.92,
      timestamp: '2024-01-15T10:31:00Z'
    },
    metadata: {
      created_by: 'AI_System',
      camera_calibrations: {
        lens_distortion: 'calibrated',
        gps_accuracy: '±2m',
        timestamp_sync: 'NTP synced'
      },
      system_version: '2.0.0'
    },
    status: 'under_review',
    package_hash: 'sha256_hash_001'
  },
  {
    id: 'evidence_002',
    incident_id: 'incident_002',
    created_at: '2024-01-15T11:16:00Z',
    events: [
      {
        camera_id: 'cam_main_entrance',
        timestamp: '2024-01-15T11:15:45Z',
        detection_type: 'vehicle',
        confidence: 0.96,
        bounding_box: { x: 200, y: 150, w: 120, h: 80 },
        attributes: {
          plate_number: 'KBC 123A',
          plate_confidence: 0.88,
          vehicle_color: 'white',
          vehicle_make: 'Toyota',
          vehicle_model: 'Corolla',
          estimated_speed: '65 km/h'
        },
        frame_hash: 'vehicle123...',
        model_version: '1.2.0'
      }
    ],
    risk_assessment: {
      risk_score: 0.65,
      risk_level: 'medium',
      factors: {
        temporal_risk: 0.4,
        spatial_risk: 0.7,
        behavioral_risk: 0.6,
        contextual_risk: 0.3,
        reason_codes: ['SPEED_VIOLATION', 'RESTRICTED_ZONE']
      },
      recommended_action: 'Operator notification',
      confidence: 0.88,
      timestamp: '2024-01-15T11:16:00Z'
    },
    metadata: {
      created_by: 'AI_System',
      camera_calibrations: {
        lens_distortion: 'calibrated',
        gps_accuracy: '±2m',
        timestamp_sync: 'NTP synced'
      },
      system_version: '2.0.0'
    },
    status: 'approved',
    reviewer_id: 'operator_001',
    review_notes: 'Speed violation confirmed. Traffic citation issued.',
    package_hash: 'sha256_hash_002'
  }
]

export const mockUsers = [
  {
    id: 'user_001',
    username: 'operator_john',
    email: 'john.doe@kenya-overwatch.go.ke',
    role: 'operator',
    permissions: ['view_incidents', 'review_evidence', 'acknowledge_alerts'],
    active: true,
    last_login: '2024-01-15T12:00:00Z'
  },
  {
    id: 'user_002',
    username: 'supervisor_mary',
    email: 'mary.smith@kenya-overwatch.go.ke',
    role: 'supervisor',
    permissions: ['view_incidents', 'review_evidence', 'acknowledge_alerts', 'manage_users'],
    active: true,
    last_login: '2024-01-15T11:30:00Z'
  },
  {
    id: 'user_003',
    username: 'admin_system',
    email: 'admin@kenya-overwatch.go.ke',
    role: 'admin',
    permissions: ['all'],
    active: true,
    last_login: '2024-01-15T10:00:00Z'
  }
]

export const mockResponseTeams = [
  {
    id: 'team_001',
    name: 'Rapid Response Unit Alpha',
    type: 'police',
    status: 'available',
    location: 'Nairobi CBD - Station A',
    contact: '+254-700-123-456',
    members: 4,
    equipment: ['patrol_vehicle', 'first_aid_kit', 'radio_communication'],
    current_incident_id: null
  },
  {
    id: 'team_002',
    name: 'Medical Response Team',
    type: 'medical',
    status: 'deployed',
    location: 'Nairobi CBD - Medical Center',
    contact: '+254-700-123-457',
    members: 3,
    equipment: ['ambulance', 'medical_kits', 'defibrillator'],
    current_incident_id: 'incident_002'
  },
  {
    id: 'team_003',
    name: 'Security Patrol Bravo',
    type: 'security',
    status: 'available',
    location: 'Nairobi CBD - Checkpoint B',
    contact: '+254-700-123-458',
    members: 2,
    equipment: ['patrol_vehicle', 'security_equipment'],
    current_incident_id: null
  }
]

export const mockDashboardStats = {
  incidents: {
    total: 24,
    active: 8,
    high_risk: 3,
    pending_reviews: 5
  },
  evidence: {
    total_packages: 45,
    pending_review: 8,
    approved: 32,
    appealed: 5
  },
  system: {
    cameras_online: 3,
    ai_models_active: 4,
    risk_alerts_today: 12,
    system_health: 'optimal'
  },
  timestamp: '2024-01-15T12:35:00Z'
}

export const mockRiskTrends = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  behavioral_risk: Math.random() * 0.5 + 0.2,
  spatial_risk: Math.random() * 0.4 + 0.1,
  temporal_risk: Math.random() * 0.3 + 0.1,
  contextual_risk: Math.random() * 0.2 + 0.05
}))

export const createMockIncident = (overrides = {}) => ({
  id: `incident_${Math.random().toString(36).substr(2, 9)}`,
  type: 'security_threat',
  title: 'Mock Security Incident',
  description: 'This is a mock incident for testing',
  location: 'Test Location',
  coordinates: { lat: -1.2921, lng: 36.8219 },
  severity: 'medium',
  status: 'active',
  risk_assessment: {
    risk_score: 0.5,
    risk_level: 'medium',
    factors: {
      temporal_risk: 0.3,
      spatial_risk: 0.4,
      behavioral_risk: 0.3,
      contextual_risk: 0.2,
      reason_codes: ['TEST_INCIDENT']
    },
    recommended_action: 'Monitor',
    confidence: 0.8,
    timestamp: new Date().toISOString()
  },
  evidence_packages: [],
  created_at: new Date().toISOString(),
  reported_by: 'test_user',
  requires_human_review: false,
  human_review_completed: false,
  ...overrides
})

export const createMockAlert = (overrides = {}) => ({
  id: `alert_${Math.random().toString(36).substr(2, 9)}`,
  type: 'test_alert',
  title: 'Test Alert',
  message: 'This is a test alert',
  severity: 'medium',
  acknowledged: false,
  requires_action: false,
  created_at: new Date().toISOString(),
  ...overrides
})