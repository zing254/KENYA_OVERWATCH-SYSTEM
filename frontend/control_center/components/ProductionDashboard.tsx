/**
 * Production-Grade Kenya Overwatch Frontend
 * Real-time AI Dashboard with Risk Scoring and Evidence Management
 */

'use client'

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { Bell, X, Check, AlertTriangle, AlertCircle, MapPin, Send, Play, Pause, RefreshCw } from 'lucide-react'

const LiveMap = lazy(() => import('@/components/LiveMap'))

interface ProductionIncident {
  id: string
  type: string
  title: string
  description: string
  location: string
  coordinates: { lat: number; lng: number }
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'responding' | 'resolved' | 'under_review'
  risk_assessment: {
    risk_score: number
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    factors: {
      temporal_risk: number
      spatial_risk: number
      behavioral_risk: number
      contextual_risk: number
      reason_codes: string[]
    }
    recommended_action: string
    confidence: number
    timestamp: string
  }
  evidence_packages: EvidencePackage[]
  created_at: string
  updated_at?: string
  requires_human_review: boolean
  human_review_completed: boolean
}

interface EvidencePackage {
  id: string
  incident_id: string
  created_at: string
  status: 'created' | 'under_review' | 'approved' | 'rejected' | 'appealed' | 'archived'
  reviewer_id?: string
  review_notes?: string
  appeal_status?: string
  package_hash: string
  events: DetectionEvent[]
}

interface DetectionEvent {
  camera_id: string
  timestamp: string
  detection_type: string
  confidence: number
  bounding_box: { x: number; y: number; w: number; h: number }
  attributes: Record<string, any>
  frame_hash: string
  model_version: string
}

interface SystemMetrics {
  ai_pipeline: { fps: number; detection_accuracy: number; false_positive_rate: number; processing_latency_ms: number }
  risk_engine: { assessments_per_hour: number; high_risk_accuracy: number; average_response_time_minutes: number }
  evidence_system: { packages_created_today: number; review_completion_rate: number; appeal_success_rate: number }
  system: { uptime_percentage: number; data_integrity_score: number; audit_log_completeness: number }
}

interface Camera {
  id: string
  name: string
  location: string
  coordinates: { lat: number; lng: number }
  status: string
  ai_enabled: boolean
  ai_models: string[]
  resolution: string
  fps: number
  risk_score: number
  detections_last_hour: number
}

interface CitizenReport {
  id: string
  type: string
  description: string
  location: string
  coordinates: { lat: number; lng: number }
  reported_by: string
  status: string
  priority: string
  created_at: string
  verified: boolean
}

interface ResponseTeam {
  id: string
  name: string
  type: string
  status: string
  location: { lat: number; lng: number }
  base: string
  members: number
  vehicles: number
  capabilities: string[]
  current_incident: string | null
  last_deployed: string
  response_time_avg: number
}

interface Dispatch {
  id: string
  incident_id: string
  team_id: string
  team_name: string
  status: string
  priority: string
  assigned_at: string
  eta: string | null
  arrived_at: string | null
  resolved_at: string | null
  notes: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  severity: string
  read: boolean
  created_at: string
  link: string
}

interface ActivityLog {
  id: string
  timestamp: string
  type: string
  action: string
  user: string
  details: string
}

interface SystemConfig {
  system: { name: string; version: string; region: string; timezone: string }
  ai: { models_enabled: string[]; risk_threshold_high: number; risk_threshold_critical: number; auto_dispatch_enabled: boolean }
  notifications: { email_enabled: boolean; sms_enabled: boolean; push_enabled: boolean }
  camera: { total_cameras: number; recording_enabled: boolean; motion_detection_enabled: boolean }
  response: { auto_dispatch_threshold: number; default_response_time_target: number }
}

interface AnalyticsCharts {
  incidents_over_time: { date: string; count: number }[]
  response_times: { day: string; avg: number }[]
  incidents_by_type: { type: string; count: number }[]
  detection_accuracy: { model: string; accuracy: number }[]
}

type TabType = 'dashboard' | 'cameras' | 'map' | 'reports' | 'teams' | 'dispatch' | 'notifications' | 'settings' | 'logs' | 'analytics' | 'deploy' | 'evidence' | 'chat' | 'incidents'

const ProductionDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<ProductionIncident[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<ProductionIncident | null>(null)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [cameras, setCameras] = useState<Camera[]>([])
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>([])
  const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>([])
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [analyticsCharts, setAnalyticsCharts] = useState<AnalyticsCharts | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [unreadCount, setUnreadCount] = useState(0)
  const [aiStatus, setAiStatus] = useState({ pipeline: 'operational', models_loaded: 4, processing_fps: 29.8 })
  const [evidenceReviewQueue, setEvidenceReviewQueue] = useState<EvidencePackage[]>([])
  const [riskTrends, setRiskTrends] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [useWebcamDirect, setUseWebcamDirect] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [deploySelectedTeam, setDeploySelectedTeam] = useState<string>('')
  const [deploySelectedIncident, setDeploySelectedIncident] = useState<string>('')
  const [deployMessage, setDeployMessage] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState<string>('')
  const [chatMessages, setChatMessages] = useState<{id: string; sender: string; message: string; timestamp: string; type: string}[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showCreateIncident, setShowCreateIncident] = useState(false)
  const [incidentFilter, setIncidentFilter] = useState<string>('all')
  const [newIncident, setNewIncident] = useState({
    title: '', description: '', type: 'emergency', severity: 'medium', location: '', coordinates: { lat: -1.2921, lng: 36.8219 }
  })
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => { setIsClient(true) }, [])

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString())
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [camerasRes, reportsRes, teamsRes, dispatchesRes, notifRes, configRes, logsRes, analyticsRes] = await Promise.all([
          fetch('http://localhost:8000/api/cameras').catch(() => ({ json: () => ({ cameras: [] }) })),
          fetch('http://localhost:8000/api/citizen/reports').catch(() => ({ json: () => ({ reports: [] }) })),
          fetch('http://localhost:8000/api/teams').catch(() => ({ json: () => ({ teams: [] }) })),
          fetch('http://localhost:8000/api/dispatch').catch(() => ({ json: () => ({ dispatches: [] }) })),
          fetch('http://localhost:8000/api/notifications').catch(() => ({ json: () => ({ notifications: [], unread_count: 0 }) })),
          fetch('http://localhost:8000/api/config').catch(() => ({ json: () => null })),
          fetch('http://localhost:8000/api/logs/activity?limit=20').catch(() => ({ json: () => ({ logs: [] }) })),
          fetch('http://localhost:8000/api/analytics/charts').catch(() => ({ json: () => null }))
        ])
        const camerasData = await camerasRes.json()
        const reportsData = await reportsRes.json()
        const teamsData = await teamsRes.json()
        const dispatchesData = await dispatchesRes.json()
        const notifData = await notifRes.json()
        const configData = await configRes.json()
        const logsData = await logsRes.json()
        const analyticsData = await analyticsRes.json()
        
        setCameras(camerasData.cameras || [])
        setCitizenReports(reportsData.reports || [])
        setResponseTeams(teamsData.teams || [])
        setDispatches(dispatchesData.dispatches || [])
        setNotifications(notifData.notifications || [])
        setUnreadCount(notifData.unread_count || 0)
        setSystemConfig(configData)
        setActivityLogs(logsData.logs || [])
        setAnalyticsCharts(analyticsData)
      } catch (error) { console.error('Failed to fetch data:', error) }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const [incidentsRes, metricsRes, evidenceRes] = await Promise.all([
          fetch('http://localhost:8000/api/incidents').catch(() => ({ json: () => [] })),
          fetch('http://localhost:8000/api/analytics/performance').catch(() => ({ json: () => null })),
          fetch('http://localhost:8000/api/evidence?status=under_review').catch(() => ({ json: () => [] }))
        ])
        const incidentsData = await incidentsRes.json()
        const metricsData = await metricsRes.json()
        const evidenceData = await evidenceRes.json()
        setIncidents(incidentsData || [])
        setSystemMetrics(metricsData)
        setEvidenceReviewQueue(evidenceData || [])
      } catch (error) { console.error('Failed to fetch incidents:', error) }
    }
    fetchIncidents()
    const interval = setInterval(fetchIncidents, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const trends = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      behavioral_risk: Math.random() * 0.5 + 0.2,
      spatial_risk: Math.random() * 0.4 + 0.1,
      temporal_risk: Math.random() * 0.3 + 0.1,
      contextual_risk: Math.random() * 0.2 + 0.05
    }))
    setRiskTrends(trends)
    const interval = setInterval(() => setRiskTrends(prev => prev.map(t => ({ ...t, behavioral_risk: Math.random() * 0.5 + 0.2 }))), 60000)
    return () => clearInterval(interval)
  }, [])

  // Auto-start webcam on mount - but show click to start
  useEffect(() => {
    // Check if webcam is available but don't auto-start
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop())
        setCameraError(false)
      })
      .catch(() => {
        setCameraError(true)
      })
  }, [])

  useEffect(() => {
    if (useWebcamDirect && videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream
    }
  }, [useWebcamDirect, webcamStream])

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: 'user' } 
      })
      setWebcamStream(stream)
      setUseWebcamDirect(true)
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (error) { 
      console.error('Failed to access webcam:', error)
      alert('Could not access webcam. Please check permissions.')
    }
  }

  const stopWebcam = () => {
    if (webcamStream) { webcamStream.getTracks().forEach(track => track.stop()); setWebcamStream(null); setUseWebcamDirect(false) }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) { case 'critical': return '#dc2626'; case 'high': return '#ea580c'; case 'medium': return '#ca8a04'; case 'low': return '#16a34a'; default: return '#6b7280' }
  }

  const getTeamStatusColor = (status: string) => {
    switch (status) { case 'available': return 'bg-green-900 text-green-400'; case 'deployed': return 'bg-blue-900 text-blue-400'; case 'unavailable': return 'bg-red-900 text-red-400'; default: return 'bg-gray-700' }
  }

  const getDispatchStatusColor = (status: string) => {
    switch (status) { case 'pending': return 'bg-yellow-900 text-yellow-400'; case 'en_route': return 'bg-blue-900 text-blue-400'; case 'on_scene': return 'bg-purple-900 text-purple-400'; case 'resolved': return 'bg-green-900 text-green-400'; default: return 'bg-gray-700' }
  }

  const formatTimestamp = (timestamp: string) => timestamp ? new Date(timestamp).toLocaleString() : ''

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'incidents', label: 'Incidents', icon: '🚨' },
    { id: 'cameras', label: 'Cameras', icon: '📹' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'teams', label: 'Teams', icon: '👥' },
    { id: 'dispatch', label: 'Dispatch', icon: '🚑' },
    { id: 'deploy', label: 'Deploy & Response', icon: '🚀' },
    { id: 'evidence', label: 'Evidence', icon: '📁' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'notifications', label: 'Alerts', icon: '🔔' },
    { id: 'logs', label: 'Logs', icon: '📜' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  const renderLogs = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold mb-4">Activity Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-3 text-gray-400">Time</th>
                <th className="text-left py-2 px-3 text-gray-400">Type</th>
                <th className="text-left py-2 px-3 text-gray-400">Action</th>
                <th className="text-left py-2 px-3 text-gray-400">User</th>
                <th className="text-left py-2 px-3 text-gray-400">Details</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map(log => (
                <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="py-2 px-3 text-gray-300">{formatTimestamp(log.timestamp)}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      log.type === 'incident' ? 'bg-red-900 text-red-400' :
                      log.type === 'dispatch' ? 'bg-blue-900 text-blue-400' :
                      log.type === 'camera' ? 'bg-green-900 text-green-400' : 'bg-gray-700'
                    }`}>{log.type}</span>
                  </td>
                  <td className="py-2 px-3 text-white">{log.action}</td>
                  <td className="py-2 px-3 text-gray-300">{log.user}</td>
                  <td className="py-2 px-3 text-gray-400">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Analytics & Reports</h2>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          📥 Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Total Incidents</div>
          <div className="text-2xl font-bold">{incidents.length}</div>
          <div className="text-xs text-green-400">+12% vs last week</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Avg Response Time</div>
          <div className="text-2xl font-bold">8.5 min</div>
          <div className="text-xs text-green-400">-2 min vs last week</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Resolution Rate</div>
          <div className="text-2xl font-bold">94%</div>
          <div className="text-xs text-green-400">+5% vs last week</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">Evidence Reviewed</div>
          <div className="text-2xl font-bold">{evidenceReviewQueue.length}</div>
          <div className="text-xs text-yellow-400">Pending review</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4">Incidents Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analyticsCharts?.incidents_over_time || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Incidents" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4">Response Times</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsCharts?.response_times || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
              <Bar dataKey="avg" fill="#10b981" name="Avg Minutes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4">Incidents by Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={analyticsCharts?.incidents_by_type || []} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label>
                {analyticsCharts?.incidents_by_type?.map((entry, index) => (
                  <Cell key={index} fill={['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][index % 5]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4">AI Detection Accuracy</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsCharts?.detection_accuracy || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" domain={[0, 100]} />
              <YAxis dataKey="model" type="category" stroke="#9ca3af" width={80} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
              <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 text-gray-400">Metric</th>
              <th className="text-left py-2 text-gray-400">Current</th>
              <th className="text-left py-2 text-gray-400">Target</th>
              <th className="text-left py-2 text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-700">
              <td className="py-2">Response Time</td>
              <td className="py-2">8.5 min</td>
              <td className="py-2">10 min</td>
              <td className="py-2 text-green-400">✓ On Track</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="py-2">Resolution Rate</td>
              <td className="py-2">94%</td>
              <td className="py-2">90%</td>
              <td className="py-2 text-green-400">✓ On Track</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="py-2">AI Detection Rate</td>
              <td className="py-2">97%</td>
              <td className="py-2">95%</td>
              <td className="py-2 text-green-400">✓ On Track</td>
            </tr>
            <tr>
              <td className="py-2">Evidence Review</td>
              <td className="py-2">85%</td>
              <td className="py-2">100%</td>
              <td className="py-2 text-yellow-400">⚠ Needs Attention</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )

  const createIncident = () => {
    if (!newIncident.title || !newIncident.location) return
    const incident: ProductionIncident = {
      id: `INC-${Date.now()}`,
      type: newIncident.type,
      title: newIncident.title,
      description: newIncident.description,
      location: newIncident.location,
      coordinates: newIncident.coordinates,
      severity: newIncident.severity as 'low' | 'medium' | 'high' | 'critical',
      status: 'active',
      risk_assessment: {
        risk_score: newIncident.severity === 'critical' ? 0.9 : newIncident.severity === 'high' ? 0.7 : newIncident.severity === 'medium' ? 0.5 : 0.3,
        risk_level: newIncident.severity as 'low' | 'medium' | 'high' | 'critical',
        factors: { temporal_risk: 0.5, spatial_risk: 0.5, behavioral_risk: 0.5, contextual_risk: 0.5, reason_codes: [] },
        recommended_action: 'Dispatch response team',
        confidence: 0.85,
        timestamp: new Date().toISOString()
      },
      evidence_packages: [],
      created_at: new Date().toISOString(),
      requires_human_review: newIncident.severity === 'critical',
      human_review_completed: false
    }
    setIncidents([incident, ...incidents])
    setShowCreateIncident(false)
    setNewIncident({ title: '', description: '', type: 'emergency', severity: 'medium', location: '', coordinates: { lat: -1.2921, lng: 36.8219 } })
  }

  const renderIncidents = () => {
    const filteredIncidents = incidentFilter === 'all' ? incidents : incidents.filter(i => i.status === incidentFilter)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Incident Management</h2>
          <button
            onClick={() => setShowCreateIncident(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            + Create Incident
          </button>
        </div>

        <div className="flex gap-2">
          {['all', 'active', 'responding', 'resolved', 'under_review'].map(filter => (
            <button
              key={filter}
              onClick={() => setIncidentFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                incidentFilter === filter ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {filter.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {filteredIncidents.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
              No incidents found
            </div>
          ) : (
            filteredIncidents.map(incident => (
              <div key={incident.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded text-sm font-bold ${
                      incident.severity === 'critical' ? 'bg-red-600 text-white' :
                      incident.severity === 'high' ? 'bg-orange-500 text-white' :
                      incident.severity === 'medium' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {incident.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      incident.status === 'active' ? 'bg-red-900 text-red-400' :
                      incident.status === 'responding' ? 'bg-blue-900 text-blue-400' :
                      incident.status === 'resolved' ? 'bg-green-900 text-green-400' : 'bg-gray-700'
                    }`}>
                      {incident.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">{new Date(incident.created_at).toLocaleString()}</div>
                </div>
                <h3 className="text-lg font-semibold mb-1">{incident.title}</h3>
                <p className="text-gray-400 text-sm mb-2">{incident.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>📍 {incident.location}</span>
                  <span>Type: {incident.type}</span>
                  <span>ID: {incident.id}</span>
                </div>
                {incident.risk_assessment && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Risk Score: <span className={`font-bold ${
                        incident.risk_assessment.risk_level === 'critical' ? 'text-red-400' :
                        incident.risk_assessment.risk_level === 'high' ? 'text-orange-400' : 'text-yellow-400'
                      }`}>{(incident.risk_assessment.risk_score * 100).toFixed(0)}%</span></span>
                      <span className="text-gray-400">Confidence: {(incident.risk_assessment.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setSelectedIncident(incident); setActiveTab('dispatch') }}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                  >
                    Dispatch
                  </button>
                  <button
                    onClick={() => setActiveTab('evidence')}
                    className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm"
                  >
                    View Evidence
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showCreateIncident && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
              <h3 className="text-xl font-bold mb-4">Create New Incident</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Title *</label>
                  <input
                    type="text"
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({...newIncident, title: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    placeholder="Incident title"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description</label>
                  <textarea
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white h-24"
                    placeholder="Describe the incident"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Type</label>
                    <select
                      value={newIncident.type}
                      onChange={(e) => setNewIncident({...newIncident, type: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    >
                      <option value="emergency">Emergency</option>
                      <option value="crime">Crime</option>
                      <option value="accident">Accident</option>
                      <option value="fire">Fire</option>
                      <option value="medical">Medical</option>
                      <option value="suspicious">Suspicious</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Severity</label>
                    <select
                      value={newIncident.severity}
                      onChange={(e) => setNewIncident({...newIncident, severity: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Location *</label>
                  <input
                    type="text"
                    value={newIncident.location}
                    onChange={(e) => setNewIncident({...newIncident, location: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    placeholder="Enter location"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={createIncident}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded font-medium"
                  >
                    Create Incident
                  </button>
                  <button
                    onClick={() => setShowCreateIncident(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Active Incidents</h3>
          <div className="text-2xl font-bold text-white">{incidents.filter(i => i.status === 'active').length}</div>
          <div className="text-xs text-gray-500 mt-1">{incidents.filter(i => i.risk_assessment?.risk_level === 'high' || i.risk_assessment?.risk_level === 'critical').length} high risk</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Deployed Teams</h3>
          <div className="text-2xl font-bold text-blue-400">{responseTeams.filter(t => t.status === 'deployed').length}</div>
          <div className="text-xs text-gray-500 mt-1">{responseTeams.filter(t => t.status === 'available').length} available</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Pending Alerts</h3>
          <div className="text-2xl font-bold text-yellow-400">{notifications.filter(n => !n.read).length}</div>
          <div className="text-xs text-gray-500 mt-1">Unread notifications</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">System Health</h3>
          <div className="text-2xl font-bold text-green-400">{systemMetrics?.system?.uptime_percentage ? (systemMetrics.system.uptime_percentage * 100).toFixed(2) : 99.98}%</div>
          <div className="text-xs text-gray-500 mt-1">AI: {aiStatus.processing_fps} FPS</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">24-Hour Risk Trends</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={riskTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[0, 1]} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
                <Line type="monotone" dataKey="behavioral_risk" stroke="#ef4444" strokeWidth={2} dot={false} name="Behavioral" />
                <Line type="monotone" dataKey="spatial_risk" stroke="#f59e0b" strokeWidth={2} dot={false} name="Spatial" />
                <Line type="monotone" dataKey="temporal_risk" stroke="#10b981" strokeWidth={2} dot={false} name="Temporal" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Active Incidents</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {incidents.filter(i => i.status === 'active' || i.status === 'responding').slice(0, 10).map(incident => (
                <div key={incident.id} className="bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600" onClick={() => setSelectedIncident(incident)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{incident.title}</h4>
                      <p className="text-sm text-gray-400">{incident.location}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium`} style={{ backgroundColor: getSeverityColor(incident.severity) + '20', color: getSeverityColor(incident.severity) }}>{incident.severity.toUpperCase()}</div>
                  </div>
                </div>
              ))}
              {incidents.length === 0 && <p className="text-gray-400 text-center py-4">No active incidents</p>}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Incidents by Severity</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { name: 'Critical', value: incidents.filter(i => i.severity === 'critical').length, fill: '#dc2626' },
                { name: 'High', value: incidents.filter(i => i.severity === 'high').length, fill: '#ea580c' },
                { name: 'Medium', value: incidents.filter(i => i.severity === 'medium').length, fill: '#ca8a04' },
                { name: 'Low', value: incidents.filter(i => i.severity === 'low').length, fill: '#16a34a' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Risk Factors</h3>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={[{ factor: 'Behavioral', value: 0.75 }, { factor: 'Spatial', value: 0.60 }, { factor: 'Temporal', value: 0.45 }, { factor: 'Contextual', value: 0.30 }]}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="factor" stroke="#9ca3af" />
                <PolarRadiusAxis stroke="#374151" domain={[0, 1]} />
                <Radar name="Risk" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  )

  const renderCameras = () => {
    const [detections, setDetections] = useState<{id: string; type: string; confidence: number; x: number; y: number; timestamp: string}[]>([])
    const [selectedCamera, setSelectedCamera] = useState<string>('cam_001')
    const [isRecording, setIsRecording] = useState(false)
    const [recordings, setRecordings] = useState<{id: string; camera: string; startTime: string; duration: number; size: string}[]>([
      { id: '1', camera: 'cam_001', startTime: '2024-01-15 14:30', duration: 15, size: '245 MB' },
      { id: '2', camera: 'cam_002', startTime: '2024-01-15 14:45', duration: 8, size: '120 MB' },
      { id: '3', camera: 'cam_001', startTime: '2024-01-15 15:00', duration: 22, size: '380 MB' },
    ])
    const [showRecordings, setShowRecordings] = useState(false)

    useEffect(() => {
      const mockDetections = [
        { id: '1', type: 'vehicle', confidence: 0.92, x: 20, y: 30, timestamp: new Date().toISOString() },
        { id: '2', type: 'person', confidence: 0.87, x: 60, y: 45, timestamp: new Date().toISOString() },
        { id: '3', type: 'license_plate', confidence: 0.78, x: 45, y: 55, timestamp: new Date().toISOString() },
      ]
      setDetections(mockDetections)
      const interval = setInterval(() => {
        setDetections([
          { id: Date.now().toString(), type: ['vehicle', 'person', 'license_plate'][Math.floor(Math.random()*3)], confidence: 0.7 + Math.random()*0.3, x: Math.random()*80+10, y: Math.random()*60+20, timestamp: new Date().toISOString() }
        ])
      }, 3000)
      return () => clearInterval(interval)
    }, [])

    return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="relative bg-black aspect-video">
          {useWebcamDirect ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-green-600 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>LIVE - YOUR WEBCAM
              </div>
              <div className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded text-xs font-medium">AI: ON</div>
              {detections.map(d => (
                <div key={d.id} className="absolute border-2 border-green-500 rounded" style={{ left: `${d.x}%`, top: `${d.y}%`, width: '60px', height: '40px' }}>
                  <span className="absolute -top-5 left-0 bg-green-600 text-white text-xs px-1 rounded">{d.type} {(d.confidence*100).toFixed(0)}%</span>
                </div>
              ))}
              <div className="absolute bottom-2 right-2"><button onClick={stopWebcam} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-medium">Stop Webcam</button></div>
            </>
          ) : cameraError ? (
            <div className="w-full h-full flex items-center justify-center flex-col text-gray-400">
              <div className="text-6xl mb-4">📷</div>
              <div className="text-lg mb-2">No Camera Available</div>
              <div className="text-sm mb-4">Click below to use your webcam</div>
              <button onClick={startWebcam} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium">Start My Webcam</button>
            </div>
          ) : (
            <>
              <img 
                src="http://localhost:8000/api/cameras/cam_001/stream" 
                alt="Live Camera Feed"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="text-gray-400 text-center w-full h-full flex items-center justify-center flex-col"><div class="text-4xl mb-2">📹</div><div class="text-sm">Camera Offline - Click to use your webcam</div></div>';
                }}
              />
              <div className="absolute top-2 left-2 bg-yellow-600 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>AI STREAM - {selectedCamera}
              </div>
              {detections.map(d => (
                <div key={d.id} className="absolute border-2 border-green-500 rounded" style={{ left: `${d.x}%`, top: `${d.y}%`, width: '60px', height: '40px' }}>
                  <span className="absolute -top-5 left-0 bg-green-600 text-white text-xs px-1 rounded">{d.type} {(d.confidence*100).toFixed(0)}%</span>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="p-3 bg-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-medium">{useWebcamDirect ? 'Your Webcam' : 'AI Camera Stream'}</span>
            <span className={`text-xs px-2 py-1 rounded ${useWebcamDirect || !cameraError ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
              {useWebcamDirect ? 'LIVE' : cameraError ? 'OFFLINE' : 'CONNECTED'}
            </span>
          </div>
          <div className="flex gap-2">
            {(!useWebcamDirect || cameraError) && <button onClick={startWebcam} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-medium">Use My Webcam</button>}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold mb-4">AI Detection & Tracking</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-700 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{detections.filter(d => d.type === 'person').length}</div>
            <div className="text-xs text-gray-400">Persons</div>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">{detections.filter(d => d.type === 'vehicle').length}</div>
            <div className="text-xs text-gray-400">Vehicles</div>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">{detections.filter(d => d.type === 'license_plate').length}</div>
            <div className="text-xs text-gray-400">License Plates</div>
          </div>
        </div>
        <div className="text-sm">
          <div className="font-medium mb-2">Recent Detections</div>
          <div className="space-y-1">
            {detections.map(d => (
              <div key={d.id} className="flex justify-between text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                <span>{d.type.toUpperCase()}</span>
                <span>{(d.confidence * 100).toFixed(1)}% confidence</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Video Management</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
            </button>
            <button
              onClick={() => setShowRecordings(!showRecordings)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              📁 Recordings ({recordings.length})
            </button>
          </div>
        </div>

        {isRecording && (
          <div className="bg-red-900 border border-red-700 p-3 rounded-lg mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-red-200">Recording in progress...</span>
            </div>
            <span className="text-red-200 text-sm">Camera: {selectedCamera}</span>
          </div>
        )}

        {showRecordings && (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 font-medium mb-2">
              <div>Camera</div>
              <div>Start Time</div>
              <div>Duration</div>
              <div>Size</div>
            </div>
            {recordings.map(rec => (
              <div key={rec.id} className="grid grid-cols-4 gap-2 text-sm bg-gray-700 p-2 rounded items-center">
                <div className="font-medium">{rec.camera}</div>
                <div className="text-gray-400">{rec.startTime}</div>
                <div>{rec.duration} min</div>
                <div className="flex justify-between items-center">
                  <span>{rec.size}</span>
                  <button className="text-blue-400 hover:text-blue-300 text-xs">▶ Play</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameras.map(camera => (
          <div key={camera.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{camera.name}</span>
              <span className={`text-xs px-2 py-1 rounded ${camera.status === 'online' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>{camera.status}</span>
            </div>
            <div className="text-sm text-gray-400">{camera.location}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div>FPS: {camera.fps}</div>
              <div>Detections: {camera.detections_last_hour}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  const renderMap = () => {
    const mapMarkers = [
      ...incidents.filter(i => i.status === 'active' && i.coordinates).map(inc => ({
        id: inc.id,
        position: [inc.coordinates.lat, inc.coordinates.lng] as [number, number],
        type: 'incident' as const,
        title: inc.title,
        description: inc.location,
        severity: inc.severity,
        status: inc.status
      })),
      ...cameras.filter(c => c.coordinates).map(cam => ({
        id: cam.id,
        position: [cam.coordinates.lat, cam.coordinates.lng] as [number, number],
        type: 'camera' as const,
        title: cam.name,
        description: cam.location,
        status: cam.status
      })),
      ...responseTeams.map(team => ({
        id: team.id,
        position: [team.location.lat, team.location.lng] as [number, number],
        type: 'team' as const,
        title: team.name,
        description: team.base,
        status: team.status
      }))
    ]

    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold mb-4">Kenya Overwatch - Live Incident Map (Nairobi)</h3>
        <div className="rounded-lg overflow-hidden" style={{ height: '500px' }}>
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <div>Loading map...</div>
              </div>
            </div>
          }>
            <LiveMap 
              markers={mapMarkers}
              center={[-1.2921, 36.8219]}
              zoom={12}
            />
          </Suspense>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{incidents.filter(i => i.status === 'active').length}</div>
            <div className="text-xs text-gray-400">Active Incidents</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{responseTeams.filter(t => t.status === 'deployed').length}</div>
            <div className="text-xs text-gray-400">Teams Deployed</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{cameras.length}</div>
            <div className="text-xs text-gray-400">Cameras Online</div>
          </div>
        </div>
      </div>
    )
  }

  const renderReports = () => (
    <div>
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Citizen Reports</h3>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium">+ New Report</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-3"><div className="text-2xl font-bold text-yellow-400">{citizenReports.filter(r => r.status === 'pending').length}</div><div className="text-sm text-gray-400">Pending</div></div>
          <div className="bg-gray-700 rounded-lg p-3"><div className="text-2xl font-bold text-blue-400">{citizenReports.filter(r => r.status === 'investigating').length}</div><div className="text-sm text-gray-400">Investigating</div></div>
          <div className="bg-gray-700 rounded-lg p-3"><div className="text-2xl font-bold text-green-400">{citizenReports.filter(r => r.status === 'resolved').length}</div><div className="text-sm text-gray-400">Resolved</div></div>
        </div>
      </div>
      <div className="space-y-4">
        {citizenReports.map(report => (
          <div key={report.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  report.priority === 'critical' ? 'bg-red-900 text-red-400' :
                  report.priority === 'high' ? 'bg-orange-900 text-orange-400' :
                  report.priority === 'medium' ? 'bg-yellow-900 text-yellow-400' : 'bg-gray-700 text-gray-400'
                }`}>{report.priority.toUpperCase()}</span>
                <span className="ml-2 text-sm text-gray-400">{report.type.replace('_', ' ')}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                report.status === 'pending' ? 'bg-yellow-900 text-yellow-400' :
                report.status === 'investigating' ? 'bg-blue-900 text-blue-400' :
                report.status === 'resolved' ? 'bg-green-900 text-green-400' : 'bg-gray-700'
              }`}>{report.status}</span>
            </div>
            <p className="text-white mb-2">{report.description}</p>
            <div className="flex justify-between text-sm text-gray-400">
              <span>📍 {report.location}</span>
              <span>{formatTimestamp(report.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderTeams = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Teams</h3>
          <div className="text-2xl font-bold">{responseTeams.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Available</h3>
          <div className="text-2xl font-bold text-green-400">{responseTeams.filter(t => t.status === 'available').length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Deployed</h3>
          <div className="text-2xl font-bold text-blue-400">{responseTeams.filter(t => t.status === 'deployed').length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Unavailable</h3>
          <div className="text-2xl font-bold text-red-400">{responseTeams.filter(t => t.status === 'unavailable').length}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {responseTeams.map(team => (
          <div key={team.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">{team.name}</h3>
                <p className="text-sm text-gray-400">{team.base}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${getTeamStatusColor(team.status)}`}>{team.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-400 mb-3">
              <div>Type: {team.type}</div>
              <div>Members: {team.members}</div>
              <div>Vehicles: {team.vehicles}</div>
              <div>Avg Response: {team.response_time_avg}min</div>
            </div>
            <div className="flex flex-wrap gap-1">
              {team.capabilities.map(cap => (
                <span key={cap} className="text-xs px-2 py-1 bg-gray-700 rounded">{cap}</span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">Dispatch</button>
              <button className="flex-1 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm">Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderDispatch = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Active Dispatches</h3>
          <div className="text-2xl font-bold">{dispatches.filter(d => d.status !== 'resolved').length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">En Route</h3>
          <div className="text-2xl font-bold text-blue-400">{dispatches.filter(d => d.status === 'en_route').length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">On Scene</h3>
          <div className="text-2xl font-bold text-purple-400">{dispatches.filter(d => d.status === 'on_scene').length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Resolved</h3>
          <div className="text-2xl font-bold text-green-400">{dispatches.filter(d => d.status === 'resolved').length}</div>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold mb-4">Active Dispatches</h3>
        <div className="space-y-3">
          {dispatches.map(dispatch => (
            <div key={dispatch.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{dispatch.team_name}</h4>
                  <p className="text-sm text-gray-400">Incident: {dispatch.incident_id}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getDispatchStatusColor(dispatch.status)}`}>{dispatch.status}</span>
              </div>
              <div className="text-sm text-gray-400 mb-2">Notes: {dispatch.notes}</div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Assigned: {formatTimestamp(dispatch.assigned_at)}</span>
                {dispatch.eta && <span>ETA: {formatTimestamp(dispatch.eta)}</span>}
              </div>
            </div>
          ))}
          {dispatches.length === 0 && <p className="text-gray-400 text-center py-4">No active dispatches</p>}
        </div>
      </div>
    </div>
  )

  const renderNotifications = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <button className="text-sm text-blue-400 hover:text-blue-300">Mark All Read</button>
      </div>
      <div className="space-y-3">
        {notifications.map(notif => (
          <div key={notif.id} className={`bg-gray-800 rounded-lg border p-4 ${notif.read ? 'border-gray-700' : 'border-blue-500'}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                <span className={`text-xs px-2 py-1 rounded ${
                  notif.severity === 'critical' ? 'bg-red-900 text-red-400' :
                  notif.severity === 'high' ? 'bg-orange-900 text-orange-400' :
                  notif.severity === 'medium' ? 'bg-yellow-900 text-yellow-400' : 'bg-gray-700'
                }`}>{notif.severity}</span>
              </div>
              <span className="text-xs text-gray-500">{formatTimestamp(notif.created_at)}</span>
            </div>
            <h4 className="font-medium mb-1">{notif.title}</h4>
            <p className="text-sm text-gray-400">{notif.message}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const renderDeploy = () => {
    const handleDeploy = async () => {
      if (!deploySelectedTeam || !deploySelectedIncident) {
        setDeployStatus('Please select both a team and an incident')
        return
      }
      setIsDeploying(true)
      setDeployStatus('')
      try {
        const response = await fetch('http://localhost:8000/api/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            team_id: deploySelectedTeam,
            incident_id: deploySelectedIncident,
            priority: 'high',
            notes: deployMessage
          })
        })
        if (response.ok) {
          setDeployStatus('Deployment successful! Team has been dispatched.')
          setDeploySelectedTeam('')
          setDeploySelectedIncident('')
          setDeployMessage('')
        } else {
          setDeployStatus('Deployment failed. Please try again.')
        }
      } catch (error) {
        setDeployStatus('Error: Could not connect to server')
      }
      setIsDeploying(false)
    }

    const handleSendResponse = async () => {
      if (!deploySelectedIncident) {
        setDeployStatus('Please select an incident')
        return
      }
      setIsDeploying(true)
      setDeployStatus('')
      try {
        const response = await fetch(`http://localhost:8000/api/incidents/${deploySelectedIncident}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response_message: deployMessage })
        })
        if (response.ok) {
          setDeployStatus('Response sent successfully!')
          setDeploySelectedIncident('')
          setDeployMessage('')
        } else {
          setDeployStatus('Failed to send response.')
        }
      } catch (error) {
        setDeployStatus('Error: Could not connect to server')
      }
      setIsDeploying(false)
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-400" /> Deploy Response Team
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Select Incident</label>
                <select 
                  value={deploySelectedIncident}
                  onChange={(e) => setDeploySelectedIncident(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Choose an incident...</option>
                  {incidents.filter(i => i.status === 'active').map(inc => (
                    <option key={inc.id} value={inc.id}>{inc.title} - {inc.location}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Select Response Team</label>
                <select 
                  value={deploySelectedTeam}
                  onChange={(e) => setDeploySelectedTeam(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Choose a team...</option>
                  {responseTeams.filter(t => t.status === 'available').map(team => (
                    <option key={team.id} value={team.id}>{team.name} - {team.base}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Deployment Notes</label>
                <textarea 
                  value={deployMessage}
                  onChange={(e) => setDeployMessage(e.target.value)}
                  placeholder="Add deployment instructions..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-20"
                />
              </div>
              <button 
                onClick={handleDeploy}
                disabled={isDeploying}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Deploy Team
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" /> Send Incident Response
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Select Incident</label>
                <select 
                  value={deploySelectedIncident}
                  onChange={(e) => setDeploySelectedIncident(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Choose an incident...</option>
                  {incidents.map(inc => (
                    <option key={inc.id} value={inc.id}>{inc.title} - {inc.status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Response Message</label>
                <textarea 
                  value={deployMessage}
                  onChange={(e) => setDeployMessage(e.target.value)}
                  placeholder="Enter response details..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-32"
                />
              </div>
              <button 
                onClick={handleSendResponse}
                disabled={isDeploying}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Response
              </button>
            </div>
          </div>
        </div>

        {deployStatus && (
          <div className={`bg-gray-800 rounded-lg border p-4 ${deployStatus.includes('success') ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
            {deployStatus}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Deploy Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => {
                const highRisk = incidents.find(i => i.risk_assessment?.risk_level === 'critical' && i.status === 'active')
                if (highRisk) {
                  setDeploySelectedIncident(highRisk.id)
                  setDeployMessage('Auto-deployed due to critical risk level')
                }
              }}
              className="bg-red-600 hover:bg-red-700 p-4 rounded-lg text-center"
            >
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">Deploy to Critical</div>
              <div className="text-xs text-red-200">Auto-select highest risk</div>
            </button>
            <button 
              onClick={() => {
                const available = responseTeams.find(t => t.status === 'available')
                if (available) setDeploySelectedTeam(available.id)
              }}
              className="bg-green-600 hover:bg-green-700 p-4 rounded-lg text-center"
            >
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">Nearest Available</div>
              <div className="text-xs text-green-200">Find closest team</div>
            </button>
            <button 
              onClick={() => {
                setDeploySelectedIncident('')
                setDeploySelectedTeam('')
                setDeployMessage('')
                setDeployStatus('')
              }}
              className="bg-gray-600 hover:bg-gray-500 p-4 rounded-lg text-center"
            >
              <Pause className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">Reset Form</div>
              <div className="text-xs text-gray-300">Clear all selections</div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderEvidence = () => {
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [selectedEvidence, setSelectedEvidence] = useState<EvidencePackage | null>(null)
    const [reviewing, setReviewing] = useState(false)

    const filteredEvidence = filterStatus === 'all' 
      ? evidenceReviewQueue 
      : evidenceReviewQueue.filter(e => e.status === filterStatus)

    const handleReview = async (evidenceId: string, decision: 'approve' | 'reject') => {
      setReviewing(true)
      try {
        await fetch(`http://localhost:8000/api/evidence/${evidenceId}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision, notes: '' })
        })
        fetchData()
      } catch (error) {
        console.error('Failed to review evidence:', error)
      }
      setReviewing(false)
      setSelectedEvidence(null)
    }

    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Evidence Management</h3>
            <div className="flex gap-2">
              {['all', 'under_review', 'approved', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded text-sm ${
                    filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {status.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            {filteredEvidence.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No evidence packages found</p>
            ) : (
              filteredEvidence.map(evidence => (
                <div key={evidence.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{evidence.id}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        evidence.status === 'approved' ? 'bg-green-900 text-green-400' :
                        evidence.status === 'rejected' ? 'bg-red-900 text-red-400' :
                        'bg-yellow-900 text-yellow-400'
                      }`}>
                        {evidence.status.toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedEvidence(evidence)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                  <div className="text-sm text-gray-400">
                    Incident: {evidence.incident_id} | Events: {evidence.events?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Package Hash: {evidence.package_hash?.substring(0, 16)}...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedEvidence && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Evidence Package Details</h3>
                <button onClick={() => setSelectedEvidence(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Package ID</label>
                  <p className="font-mono">{selectedEvidence.id}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Incident ID</label>
                  <p>{selectedEvidence.incident_id}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Status</label>
                  <p className={`${
                    selectedEvidence.status === 'approved' ? 'text-green-400' :
                    selectedEvidence.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                  }`}>{selectedEvidence.status.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Package Hash</label>
                  <p className="font-mono text-xs break-all">{selectedEvidence.package_hash}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Detection Events</label>
                  <div className="mt-2 space-y-2">
                    {selectedEvidence.events?.map((event, idx) => (
                      <div key={idx} className="bg-gray-700 p-2 rounded text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-400">{event.camera_id}</span>
                          <span className="text-gray-500">{event.detection_type}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Confidence: {(event.confidence * 100).toFixed(1)}% | Model: {event.model_version}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedEvidence.status === 'under_review' && (
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => handleReview(selectedEvidence.id, 'approve')}
                      disabled={reviewing}
                      className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(selectedEvidence.id, 'reject')}
                      disabled={reviewing}
                      className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded font-medium"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return
    const msg = {
      id: Date.now().toString(),
      sender: 'Control Center',
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'dispatch'
    }
    setChatMessages([...chatMessages, msg])
    setNewMessage('')
  }

  const renderChat = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold mb-4">Dispatch Communication</h3>
        <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto space-y-3 mb-4">
          {chatMessages.length === 0 ? (
            <p className="text-gray-500 text-center">No messages yet. Start a conversation with response teams.</p>
          ) : (
            chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'Control Center' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-lg ${
                  msg.sender === 'Control Center' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}>
                  <div className="text-xs opacity-70 mb-1">{msg.sender} • {new Date(msg.timestamp).toLocaleTimeString()}</div>
                  <div>{msg.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message to response teams..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
          >
            Send
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold mb-4">Quick Messages</h3>
        <div className="grid grid-cols-2 gap-2">
          {['All units report to station', 'Standby for deployment', 'Emergency assembly point', 'Code Red - All units', 'Traffic incident reported', 'Medical emergency'].map((msg, idx) => (
            <button
              key={idx}
              onClick={() => { setNewMessage(msg); sendMessage() }}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm text-left"
            >
              {msg}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      {systemConfig && (
        <>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-4">System Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">System Name:</span> {systemConfig.system.name}</div>
              <div><span className="text-gray-400">Version:</span> {systemConfig.system.version}</div>
              <div><span className="text-gray-400">Region:</span> {systemConfig.system.region}</div>
              <div><span className="text-gray-400">Timezone:</span> {systemConfig.system.timezone}</div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-4">AI Configuration</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Enabled Models</span>
                <div className="flex gap-1 flex-wrap justify-end">{systemConfig.ai.models_enabled.map(m => <span key={m} className="text-xs px-2 py-1 bg-gray-700 rounded">{m}</span>)}</div>
              </div>
              <div className="flex justify-between items-center"><span>High Risk Threshold</span><span>{systemConfig.ai.risk_threshold_high}</span></div>
              <div className="flex justify-between items-center"><span>Critical Risk Threshold</span><span>{systemConfig.ai.risk_threshold_critical}</span></div>
              <div className="flex justify-between items-center"><span>Auto Dispatch</span><span className={systemConfig.ai.auto_dispatch_enabled ? 'text-green-400' : 'text-red-400'}>{systemConfig.ai.auto_dispatch_enabled ? 'Enabled' : 'Disabled'}</span></div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span>Email Notifications</span><span className={systemConfig.notifications.email_enabled ? 'text-green-400' : 'text-gray-400'}>{systemConfig.notifications.email_enabled ? 'Enabled' : 'Disabled'}</span></div>
              <div className="flex justify-between items-center"><span>SMS Notifications</span><span className={systemConfig.notifications.sms_enabled ? 'text-green-400' : 'text-gray-400'}>{systemConfig.notifications.sms_enabled ? 'Enabled' : 'Disabled'}</span></div>
              <div className="flex justify-between items-center"><span>Push Notifications</span><span className={systemConfig.notifications.push_enabled ? 'text-green-400' : 'text-gray-400'}>{systemConfig.notifications.push_enabled ? 'Enabled' : 'Disabled'}</span></div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-4">Camera Settings</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span>Total Cameras</span><span>{systemConfig.camera.total_cameras}</span></div>
              <div className="flex justify-between items-center"><span>Recording</span><span className={systemConfig.camera.recording_enabled ? 'text-green-400' : 'text-gray-400'}>{systemConfig.camera.recording_enabled ? 'Enabled' : 'Disabled'}</span></div>
              <div className="flex justify-between items-center"><span>Motion Detection</span><span className={systemConfig.camera.motion_detection_enabled ? 'text-green-400' : 'text-gray-400'}>{systemConfig.camera.motion_detection_enabled ? 'Enabled' : 'Disabled'}</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Kenya Overwatch</h1>
            <p className="text-gray-400">Real-time AI Surveillance & Emergency Response</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">AI: {aiStatus.pipeline}</span>
            </div>
            <div className="text-sm text-gray-400">{aiStatus.processing_fps} FPS</div>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-700 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="text-white font-semibold">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map(notif => (
                      <div key={notif.id} className={`p-3 border-b border-gray-700 ${!notif.read ? 'bg-gray-750' : ''}`}>
                        <div className="flex items-start gap-3">
                          <AlertCircle className={`w-5 h-5 ${notif.severity === 'critical' ? 'text-red-500' : notif.severity === 'high' ? 'text-orange-500' : 'text-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-gray-300'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-400">{isClient ? currentTime : ''}</div>
          </div>
        </div>
        <div className="flex space-x-2 mt-4 border-t border-gray-700 pt-4 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'notifications' && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </header>
      <main className="p-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'incidents' && renderIncidents()}
        {activeTab === 'cameras' && renderCameras()}
        {activeTab === 'map' && renderMap()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'teams' && renderTeams()}
        {activeTab === 'dispatch' && renderDispatch()}
        {activeTab === 'deploy' && renderDeploy()}
        {activeTab === 'evidence' && renderEvidence()}
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'settings' && renderSettings()}
      </main>
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedIncident(null)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedIncident.title}</h2>
              <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <p className="text-gray-300 mb-4">{selectedIncident.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Location:</span> {selectedIncident.location}</div>
              <div><span className="text-gray-400">Severity:</span> <span style={{ color: getSeverityColor(selectedIncident.severity) }}>{selectedIncident.severity}</span></div>
              <div><span className="text-gray-400">Status:</span> {selectedIncident.status}</div>
              <div><span className="text-gray-400">Risk Score:</span> {selectedIncident.risk_assessment?.risk_score?.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductionDashboard
