import { useState, useEffect } from 'react'
import { ProductionIncident, EvidencePackage, SystemMetrics, Alert, DashboardStats } from '@/types'
import ApiService from '@/utils/api'

export const useIncidents = (filters?: { status?: string; severity?: string }) => {
  const [incidents, setIncidents] = useState<ProductionIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.getIncidents(filters)
      setIncidents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch incidents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [filters?.status, filters?.severity])

  const createIncident = async (incident: Partial<ProductionIncident>) => {
    try {
      const newIncident = await ApiService.createIncident(incident)
      setIncidents(prev => [newIncident, ...prev])
      return newIncident
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create incident')
      throw err
    }
  }

  const updateIncidentStatus = async (id: string, status: string) => {
    try {
      const updatedIncident = await ApiService.updateIncidentStatus(id, status)
      setIncidents(prev => prev.map(inc => inc.id === id ? updatedIncident : inc))
      return updatedIncident
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update incident')
      throw err
    }
  }

  return {
    incidents,
    loading,
    error,
    refetch: fetchIncidents,
    createIncident,
    updateIncidentStatus,
  }
}

export const useEvidence = (filters?: { incident_id?: string; status?: string }) => {
  const [evidence, setEvidence] = useState<EvidencePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvidence = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.getEvidence(filters)
      setEvidence(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch evidence')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvidence()
  }, [filters?.incident_id, filters?.status])

  const reviewEvidence = async (id: string, review: {
    reviewer_id: string
    decision: 'approve' | 'reject'
    notes: string
  }) => {
    try {
      await ApiService.reviewEvidence(id, review)
      setEvidence(prev => prev.map(pkg => 
        pkg.id === id 
          ? { ...pkg, status: review.decision === 'approve' ? 'approved' : 'rejected', reviewer_id: review.reviewer_id, review_notes: review.notes }
          : pkg
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review evidence')
      throw err
    }
  }

  return {
    evidence,
    loading,
    error,
    refetch: fetchEvidence,
    reviewEvidence,
  }
}

export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.getSystemMetrics()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  }
}

export const useAlerts = (filters?: { severity?: string; acknowledged?: boolean }) => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.getAlerts(filters)
      setAlerts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [filters?.severity, filters?.acknowledged])

  const acknowledgeAlert = async (id: string, acknowledgment: {
    acknowledged_by: string
    action_taken: string
  }) => {
    try {
      await ApiService.acknowledgeAlert(id, acknowledgment)
      setAlerts(prev => prev.map(alert => 
        alert.id === id 
          ? { ...alert, acknowledged: true }
          : alert
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alert')
      throw err
    }
  }

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts,
    acknowledgeAlert,
  }
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.getDashboardStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}

export default useIncidents