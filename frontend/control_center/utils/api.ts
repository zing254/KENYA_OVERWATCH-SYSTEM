import { ProductionIncident, EvidencePackage, SystemMetrics, Alert, Milestone } from '@/types'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Health and System
  static async getHealth() {
    return this.request('/api/health')
  }

  static async getSystemMetrics(): Promise<SystemMetrics> {
    return this.request('/api/analytics/performance')
  }

  // Incidents
  static async getIncidents(filters?: {
    status?: string
    severity?: string
  }): Promise<ProductionIncident[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.severity) params.append('severity', filters.severity)
    
    const query = params.toString() ? `?${params}` : ''
    return this.request(`/api/incidents${query}`)
  }

  static async getIncident(id: string): Promise<ProductionIncident> {
    return this.request(`/api/incidents/${id}`)
  }

  static async createIncident(incident: Partial<ProductionIncident>): Promise<ProductionIncident> {
    return this.request('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(incident),
    })
  }

  static async updateIncidentStatus(id: string, status: string): Promise<ProductionIncident> {
    return this.request(`/api/incidents/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  // Evidence
  static async getEvidence(filters?: {
    incident_id?: string
    status?: string
  }): Promise<EvidencePackage[]> {
    const params = new URLSearchParams()
    if (filters?.incident_id) params.append('incident_id', filters.incident_id)
    if (filters?.status) params.append('status', filters.status)
    
    const query = params.toString() ? `?${params}` : ''
    return this.request(`/api/evidence${query}`)
  }

  static async getEvidencePackage(id: string): Promise<EvidencePackage> {
    return this.request(`/api/evidence/${id}`)
  }

  static async reviewEvidence(id: string, review: {
    reviewer_id: string
    decision: 'approve' | 'reject'
    notes: string
  }): Promise<{ message: string; status: string }> {
    return this.request(`/api/evidence/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(review),
    })
  }

  static async submitAppeal(id: string, appeal: {
    reason: string
    citizen_id: string
  }): Promise<{ message: string }> {
    return this.request(`/api/evidence/${id}/appeal`, {
      method: 'POST',
      body: JSON.stringify(appeal),
    })
  }

  // Risk Assessment
  static async getRiskScores(cameraId?: string): Promise<any> {
    const query = cameraId ? `?camera_id=${cameraId}` : ''
    return this.request(`/api/risk/scores${query}`)
  }

  static async assessRisk(assessment: any): Promise<any> {
    return this.request('/api/risk/assess', {
      method: 'POST',
      body: JSON.stringify(assessment),
    })
  }

  // Cameras
  static async getCameras(): Promise<any> {
    return this.request('/api/cameras')
  }

  static async enableCameraAI(cameraId: string, config: {
    models: string[]
  }): Promise<any> {
    return this.request(`/api/cameras/${cameraId}/ai/enable`, {
      method: 'POST',
      body: JSON.stringify(config),
    })
  }

  // Alerts
  static async getAlerts(filters?: {
    severity?: string
    acknowledged?: boolean
  }): Promise<Alert[]> {
    const params = new URLSearchParams()
    if (filters?.severity) params.append('severity', filters.severity)
    if (filters?.acknowledged !== undefined) params.append('acknowledged', filters.acknowledged.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return this.request(`/api/alerts${query}`)
  }

  static async acknowledgeAlert(id: string, acknowledgment: {
    acknowledged_by: string
    action_taken: string
  }): Promise<{ message: string }> {
    return this.request(`/api/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify(acknowledgment),
    })
  }

  // Dashboard
  static async getDashboardStats(): Promise<any> {
    return this.request('/api/dashboard/stats')
  }

  // Milestones
  static async getMilestones(filters?: {
    status?: string
    milestone_type?: string
    assigned_to?: string
  }): Promise<Milestone[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.milestone_type) params.append('milestone_type', filters.milestone_type)
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to)
    
    const query = params.toString() ? `?${params}` : ''
    return this.request(`/api/milestones${query}`)
  }

  static async getMilestone(id: string): Promise<Milestone> {
    return this.request(`/api/milestones/${id}`)
  }

  static async createMilestone(milestone: Partial<Milestone>): Promise<Milestone> {
    return this.request('/api/milestones', {
      method: 'POST',
      body: JSON.stringify(milestone),
    })
  }

  static async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone> {
    return this.request(`/api/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  static async updateMilestoneStatus(id: string, status: string, updatedBy: string): Promise<Milestone> {
    return this.request(`/api/milestones/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, updated_by: updatedBy }),
    })
  }

  static async submitMilestoneForApproval(id: string, submittedBy: string): Promise<Milestone> {
    return this.request(`/api/milestones/${id}/submit-for-approval`, {
      method: 'POST',
      body: JSON.stringify({ submitted_by: submittedBy }),
    })
  }

  static async approveMilestone(id: string, approvedBy: string, userRole: string, notes?: string): Promise<Milestone> {
    return this.request(`/api/milestones/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved_by: approvedBy, user_role: userRole, notes }),
    })
  }

  static async rejectMilestone(id: string, rejectedBy: string, userRole: string, reason: string): Promise<Milestone> {
    return this.request(`/api/milestones/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejected_by: rejectedBy, user_role: userRole, reason }),
    })
  }

  static async deleteMilestone(id: string): Promise<{ message: string }> {
    return this.request(`/api/milestones/${id}`, {
      method: 'DELETE',
    })
  }
}

export default ApiService