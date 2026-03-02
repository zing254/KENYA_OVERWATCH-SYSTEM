import api from './client'
import type { 
  Accident, Violation, Vehicle, Driver, Road, Hotspot, 
  Camera, Team, DashboardStats, DashboardSummary, Alert,
  Dispatch, CitizenReport, RevenueStats, AnalyticsTrends, RoadSegment
} from './types'

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/api/dashboard/stats'),
  getSummary: () => api.get<DashboardSummary>('/api/dashboard/summary'),
}

export const accidentsApi = {
  list: (params?: { status?: string; severity?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.severity) query.set('severity', params.severity)
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.offset) query.set('offset', params.offset.toString())
    return api.get<{ total: number; accidents: Accident[] }>(`/api/accidents?${query}`)
  },
  get: (id: string) => api.get<Accident>(`/api/accidents/${id}`),
  create: (data: Partial<Accident>) => api.post<Accident>('/api/accidents', data),
  update: (id: string, data: Partial<Accident>) => api.put<Accident>(`/api/accidents/${id}`, data),
  getHotspots: () => api.get<Hotspot[]>('/api/accidents/hotspots'),
}

export const violationsApi = {
  list: (params?: { status?: string; violation_type?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.violation_type) query.set('violation_type', params.violation_type)
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.offset) query.set('offset', params.offset.toString())
    return api.get<{ total: number; violations: Violation[] }>(`/api/violations?${query}`)
  },
  get: (id: string) => api.get<Violation>(`/api/violations/${id}`),
  create: (data: Partial<Violation>) => api.post<Violation>('/api/violations', data),
  review: (id: string, data: { approved: boolean; notes?: string }) => 
    api.post<Violation>(`/api/violations/${id}/review`, data),
  pay: (id: string) => api.post<Violation>(`/api/violations/${id}/pay`),
  getRevenue: () => api.get<RevenueStats>('/api/violations/stats/revenue'),
}

export const vehiclesApi = {
  get: (plateNumber: string) => api.get<Vehicle>(`/api/vehicles/${plateNumber}`),
  getViolations: (plateNumber: string) => 
    api.get<{ total: number; violations: Violation[] }>(`/api/vehicles/${plateNumber}/violations`),
  search: (query: string) => api.get<Vehicle[]>(`/api/vehicles/search?q=${query}`),
}

export const driversApi = {
  get: (licenseNumber: string) => api.get<Driver>(`/api/drivers/${licenseNumber}`),
  getViolations: (licenseNumber: string) => 
    api.get<{ total: number; violations: Violation[] }>(`/api/drivers/${licenseNumber}/violations`),
  search: (query: string) => api.get<Driver[]>(`/api/drivers/search?q=${query}`),
}

export const roadsApi = {
  list: () => api.get<Road[]>('/api/roads'),
  get: (id: string) => api.get<Road>(`/api/roads/${id}`),
  getSegments: (roadId?: string) => {
    const query = roadId ? `?road_id=${roadId}` : ''
    return api.get<RoadSegment[]>(`/api/roads/segments${query}`)
  },
  getStats: (roadName: string) => api.get<any>(`/api/roads/${roadName}/stats`),
}

export const camerasApi = {
  list: (params?: { status?: string; type?: string }) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.type) query.set('type', params.type)
    return api.get<Camera[]>(`/api/cameras?${query}`)
  },
  get: (id: string) => api.get<Camera>(`/api/cameras/${id}`),
  getLatestImage: (id: string) => api.get<{ image_url: string }>(`/api/cameras/${id}/latest`),
}

export const teamsApi = {
  list: (params?: { type?: string; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.type) query.set('type', params.type)
    if (params?.status) query.set('status', params.status)
    return api.get<Team[]>(`/api/teams?${query}`)
  },
  get: (id: string) => api.get<Team>(`/api/teams/${id}`),
  dispatch: (teamId: string, incidentId: string) => 
    api.post<Dispatch>(`/api/teams/${teamId}/dispatch`, { incident_id: incidentId }),
}

export const alertsApi = {
  list: (params?: { severity?: string; type?: string; active?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.severity) query.set('severity', params.severity)
    if (params?.type) query.set('type', params.type)
    if (params?.active !== undefined) query.set('active', params.active.toString())
    return api.get<Alert[]>(`/api/alerts?${query}`)
  },
  create: (data: Partial<Alert>) => api.post<Alert>('/api/alerts', data),
  dismiss: (id: string) => api.post<void>(`/api/alerts/${id}/dismiss`),
}

export const reportsApi = {
  create: (data: Partial<CitizenReport>) => api.post<CitizenReport>('/api/citizen/reports', data),
  getStatus: (id: string) => api.get<CitizenReport>(`/api/citizen/reports/${id}`),
  list: (params?: { status?: string }) => {
    const query = params?.status ? `?status=${params.status}` : ''
    return api.get<{ total: number; reports: CitizenReport[] }>(`/api/citizen/reports${query}`)
  },
}

export const analyticsApi = {
  getTrends: () => api.get<AnalyticsTrends>('/api/analytics/trends'),
  getAccidentsByType: () => api.get<{ type: string; count: number }[]>('/api/analytics/accidents/by-type'),
  getAccidentsByCause: () => api.get<{ cause: string; count: number }[]>('/api/analytics/accidents/by-cause'),
  getViolationsByType: () => api.get<{ type: string; count: number }[]>('/api/analytics/violations/by-type'),
}

export const enumsApi = {
  getAccidentTypes: () => api.get<string[]>('/api/enums/accident-types'),
  getCauseTypes: () => api.get<string[]>('/api/enums/cause-types'),
  getSeverityLevels: () => api.get<string[]>('/api/enums/severity-levels'),
  getVehicleTypes: () => api.get<string[]>('/api/enums/vehicle-types'),
}
