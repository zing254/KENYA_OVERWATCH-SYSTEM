export interface Accident {
  id: string
  accident_type: string
  cause: string
  location: string
  road_name: string
  latitude: number
  longitude: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: string
  casualties: number
  injuries: number
  vehicles_involved: number
  description: string
  reported_at: string
  updated_at: string
  responded_at?: string
  cleared_at?: string
}

export interface Violation {
  id: string
  violation_type: string
  plate_number: string
  vehicle_type: string
  location: string
  latitude: number
  longitude: number
  speed_detected?: number
  speed_limit?: number
  image_url?: string
  fine_amount: number
  status: string
  points_deducted: number
  detected_at: string
  reviewed_at?: string
  paid_at?: string
}

export interface Vehicle {
  plate_number: string
  make: string
  model: string
  year: number
  color: string
  vehicle_type: string
  owner_name: string
  owner_id: string
  license_expiry: string
  insurance_expiry: string
  inspection_expiry: string
  is_stolen: boolean
  violations_count: number
  accidents_count: number
  registered_at: string
}

export interface Driver {
  license_number: string
  first_name: string
  last_name
  date_of_birth: string
  nationality: string
  license_class: string
  license_expiry: string
  points_remaining: number
  total_points_deducted: number
  violations_count: number
  accidents_count: number
  status: 'valid' | 'suspended' | 'expired'
  registered_at: string
}

export interface Road {
  id: string
  name: string
  category: 'highway' | 'arterial' | 'urban' | 'residential'
  speed_limit: number
  lanes: number
  start_latitude: number
  start_longitude: number
  end_latitude: number
  end_longitude: number
  accidents_30d: number
  accidents_90d: number
  risk_level: 'low' | 'medium' | 'high' | 'extreme'
  risk_score: number
}

export interface Hotspot {
  id: string
  name: string
  latitude: number
  longitude: number
  risk_score: number
  incidents_30d: number
  incidents_90d: number
  incidents_year: number
  primary_cause: string
  recommendations: string
}

export interface Camera {
  id: string
  name: string
  location: string
  latitude: number
  longitude: number
  road_name: string
  type: 'speed' | 'red_light' | 'surveillance' | 'ANPR'
  status: 'online' | 'offline' | 'maintenance'
  last_image_url?: string
  speed_detected?: number
  last_update: string
}

export interface Team {
  id: string
  name: string
  type: 'ambulance' | 'police' | 'fire' | 'traffic'
  status: 'available' | 'dispatched' | 'on_scene' | 'off_duty'
  base: string
  members: number
  latitude: number
  longitude: number
  current_incident_id?: string
  eta?: string
}

export interface DashboardStats {
  today_accidents: number
  today_violations: number
  today_casualties: number
  today_injuries: number
  pending_violations: number
  paid_violations: number
  avg_response_time: number
  active_teams: number
  active_cameras: number
  total_roads_monitored: number
  total_hotspots: number
}

export interface DashboardSummary {
  active_incidents: number
  today_accidents: number
  today_violations: number
  pending_violations: number
  total_casualties_today: number
  avg_response_time: number
  recent_accidents: Accident[]
  recent_violations: Violation[]
}

export interface Alert {
  id: string
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'accident' | 'violation' | 'weather' | 'road' | 'system'
  location?: string
  latitude?: number
  longitude?: number
  created_at: string
  expires_at?: string
  is_active: boolean
}

export interface Dispatch {
  id: string
  incident_id: string
  team_id: string
  team_name: string
  status: 'pending' | 'accepted' | 'en_route' | 'on_scene' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigned_at: string
  accepted_at?: string
  arrived_at?: string
  completed_at?: string
  eta?: string
  notes?: string
}

export interface CitizenReport {
  id: string
  type: 'emergency' | 'accident' | 'crime' | 'suspicious' | 'road_hazard' | 'other'
  description: string
  location: string
  latitude?: number
  longitude?: number
  first_name: string
  last_name: string
  phone_number: string
  anonymous: boolean
  attachments: string[]
  status: 'pending' | 'reviewed' | 'dispatched' | 'resolved' | 'rejected'
  created_at: string
  resolved_at?: string
}

export interface RevenueStats {
  daily: number
  weekly: number
  monthly: number
  yearly: number
  pending: number
  collected: number
}

export interface AnalyticsTrends {
  accidents_by_month: { month: string; count: number }[]
  violations_by_month: { month: string; count: number }[]
  casualties_by_month: { month: string; count: number }[]
  hotspots_trend: { month: string; count: number }[]
}

export interface RoadSegment {
  id: string
  road_id: string
  road_name: string
  start_point: string
  end_point: string
  start_latitude: number
  start_longitude: number
  end_latitude: number
  end_longitude: number
  speed_limit: number
  accidents_30d: number
  risk_level: string
  risk_score: number
}
