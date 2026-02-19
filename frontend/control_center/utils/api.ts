import { ProductionIncident, EvidencePackage, SystemMetrics, Alert, Milestone } from '@/types'
import toast from 'react-hot-toast'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ApiError extends Error {
  status?: number
  code?: string
  details?: any
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getErrorMessage = (status: number, data?: any): string => {
  if (data?.detail) {
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) {
      return data.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
    }
  }
  
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Authentication required. Please log in.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    408: 'Request timeout. Please try again.',
    422: 'Validation error. Please check your input.',
    429: 'Too many requests. Please wait a moment.',
    500: 'Server error. Please try again later.',
    502: 'Service temporarily unavailable.',
    503: 'Service is under maintenance.',
    504: 'Gateway timeout. Please try again.',
  }
  
  return messages[status] || `Request failed with status ${status}`
}

const logError = (context: string, error: ApiError, endpoint: string) => {
  console.error(`[API Error] ${context}:`, {
    message: error.message,
    status: error.status,
    code: error.code,
    endpoint,
    timestamp: new Date().toISOString(),
  })
}

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = MAX_RETRIES
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const method = options.method || 'GET'
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      })

      if (!response.ok) {
        let errorData: any = null
        try {
          errorData = await response.json()
        } catch {
          errorData = null
        }

        const error: ApiError = new Error(getErrorMessage(response.status, errorData))
        error.status = response.status
        error.code = `HTTP_${response.status}`
        error.details = errorData

        logError('HTTP Error', error, endpoint)

        if (response.status === 429 && retries > 0) {
          const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1)
          await sleep(delay)
          return this.request(endpoint, options, retries - 1)
        }

        if (response.status >= 500 && retries > 0) {
          await sleep(RETRY_DELAY)
          return this.request(endpoint, options, retries - 1)
        }

        if (response.status === 401 || response.status === 403) {
          toast.error(error.message)
        }

        throw error
      }

      return response.json()
    } catch (error: any) {
      if (error.status) throw error

      const apiError: ApiError = new Error(
        error.message || 'Network error. Please check your connection.'
      )
      apiError.code = 'NETWORK_ERROR'
      
      logError('Network Error', apiError, endpoint)

      if (retries > 0 && error.message.includes('fetch')) {
        await sleep(RETRY_DELAY)
        return this.request(endpoint, options, retries - 1)
      }

      throw apiError
    }
  }

  static async getHealth() {
    return this.request('/api/health')
  }

  static async getSystemMetrics(): Promise<SystemMetrics> {
    return this.request('/api/analytics/performance')
  }

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
    toast.loading('Creating incident...', { id: 'incident-create' })
    try {
      const result = await this.request<ProductionIncident>('/api/incidents', {
        method: 'POST',
        body: JSON.stringify(incident),
      })
      toast.success('Incident created successfully', { id: 'incident-create' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to create incident', { id: 'incident-create' })
      throw error
    }
  }

  static async updateIncidentStatus(id: string, status: string): Promise<ProductionIncident> {
    toast.loading('Updating incident status...', { id: 'incident-update' })
    try {
      const result = await this.request<ProductionIncident>(`/api/incidents/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      toast.success('Incident status updated', { id: 'incident-update' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status', { id: 'incident-update' })
      throw error
    }
  }

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
    toast.loading('Submitting review...', { id: 'evidence-review' })
    try {
      const result = await this.request<{ message: string; status: string }>(`/api/evidence/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(review),
      })
      toast.success(`Evidence ${review.decision === 'approve' ? 'approved' : 'rejected'}`, { id: 'evidence-review' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review', { id: 'evidence-review' })
      throw error
    }
  }

  static async submitAppeal(id: string, appeal: {
    reason: string
    citizen_id: string
  }): Promise<{ message: string }> {
    toast.loading('Submitting appeal...', { id: 'appeal-submit' })
    try {
      const result = await this.request<{ message: string }>(`/api/evidence/${id}/appeal`, {
        method: 'POST',
        body: JSON.stringify(appeal),
      })
      toast.success('Appeal submitted successfully', { id: 'appeal-submit' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit appeal', { id: 'appeal-submit' })
      throw error
    }
  }

  static async getRiskScores(cameraId?: string): Promise<any> {
    const query = cameraId ? `?camera_id=${cameraId}` : ''
    return this.request(`/api/risk/scores${query}`)
  }

  static async assessRisk(assessment: any): Promise<any> {
    toast.loading('Running risk assessment...', { id: 'risk-assess' })
    try {
      const result = await this.request<any>('/api/risk/assess', {
        method: 'POST',
        body: JSON.stringify(assessment),
      })
      toast.success('Risk assessment complete', { id: 'risk-assess' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Risk assessment failed', { id: 'risk-assess' })
      throw error
    }
  }

  static async getCameras(): Promise<any> {
    return this.request('/api/cameras')
  }

  static async enableCameraAI(cameraId: string, config: {
    models: string[]
  }): Promise<any> {
    toast.loading('Enabling AI models...', { id: 'camera-ai' })
    try {
      const result = await this.request<any>(`/api/cameras/${cameraId}/ai/enable`, {
        method: 'POST',
        body: JSON.stringify(config),
      })
      toast.success('AI models enabled', { id: 'camera-ai' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to enable AI', { id: 'camera-ai' })
      throw error
    }
  }

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
    toast.loading('Acknowledging alert...', { id: 'alert-ack' })
    try {
      const result = await this.request<{ message: string }>(`/api/alerts/${id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify(acknowledgment),
      })
      toast.success('Alert acknowledged', { id: 'alert-ack' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to acknowledge alert', { id: 'alert-ack' })
      throw error
    }
  }

  static async getDashboardStats(): Promise<any> {
    return this.request('/api/dashboard/stats')
  }

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
    toast.loading('Creating milestone...', { id: 'milestone-create' })
    try {
      const result = await this.request<Milestone>('/api/milestones', {
        method: 'POST',
        body: JSON.stringify(milestone),
      })
      toast.success('Milestone created', { id: 'milestone-create' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to create milestone', { id: 'milestone-create' })
      throw error
    }
  }

  static async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone> {
    toast.loading('Updating milestone...', { id: 'milestone-update' })
    try {
      const result = await this.request<Milestone>(`/api/milestones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      toast.success('Milestone updated', { id: 'milestone-update' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to update milestone', { id: 'milestone-update' })
      throw error
    }
  }

  static async updateMilestoneStatus(id: string, status: string, updatedBy: string): Promise<Milestone> {
    toast.loading('Updating status...', { id: 'milestone-status' })
    try {
      const result = await this.request<Milestone>(`/api/milestones/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, updated_by: updatedBy }),
      })
      toast.success('Status updated', { id: 'milestone-status' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status', { id: 'milestone-status' })
      throw error
    }
  }

  static async submitMilestoneForApproval(id: string, submittedBy: string): Promise<Milestone> {
    toast.loading('Submitting for approval...', { id: 'milestone-submit' })
    try {
      const result = await this.request<Milestone>(`/api/milestones/${id}/submit-for-approval`, {
        method: 'POST',
        body: JSON.stringify({ submitted_by: submittedBy }),
      })
      toast.success('Submitted for approval', { id: 'milestone-submit' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit', { id: 'milestone-submit' })
      throw error
    }
  }

  static async approveMilestone(id: string, approvedBy: string, userRole: string, notes?: string): Promise<Milestone> {
    toast.loading('Approving milestone...', { id: 'milestone-approve' })
    try {
      const result = await this.request<Milestone>(`/api/milestones/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approved_by: approvedBy, user_role: userRole, notes }),
      })
      toast.success('Milestone approved', { id: 'milestone-approve' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve', { id: 'milestone-approve' })
      throw error
    }
  }

  static async rejectMilestone(id: string, rejectedBy: string, userRole: string, reason: string): Promise<Milestone> {
    toast.loading('Rejecting milestone...', { id: 'milestone-reject' })
    try {
      const result = await this.request<Milestone>(`/api/milestones/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejected_by: rejectedBy, user_role: userRole, reason }),
      })
      toast.success('Milestone rejected', { id: 'milestone-reject' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject', { id: 'milestone-reject' })
      throw error
    }
  }

  static async deleteMilestone(id: string): Promise<{ message: string }> {
    toast.loading('Deleting milestone...', { id: 'milestone-delete' })
    try {
      const result = await this.request<{ message: string }>(`/api/milestones/${id}`, {
        method: 'DELETE',
      })
      toast.success('Milestone deleted', { id: 'milestone-delete' })
      return result
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete', { id: 'milestone-delete' })
      throw error
    }
  }
}

export default ApiService
