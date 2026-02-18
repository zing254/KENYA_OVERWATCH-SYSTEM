/**
 * Production-Grade Kenya Overwatch Frontend
 * Real-time AI Dashboard with Risk Scoring and Evidence Management
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import MilestoneList from './MilestoneList'

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

type TabType = 'dashboard' | 'cameras' | 'map' | 'reports' | 'teams' | 'dispatch' | 'notifications' | 'settings' | 'logs' | 'analytics' | 'milestones'

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

  // Auto-start webcam on mount
  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720, facingMode: 'user' } 
        })
        setWebcamStream(stream)
        setUseWebcamDirect(true)
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (error) {
        console.log('Webcam not available, using stream instead')
        setCameraError(true)
      }
    }
    // Delay to ensure page is ready
    setTimeout(initWebcam, 1000)
  }, [])

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
    { id: 'cameras', label: 'Cameras', icon: '📹' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'teams', label: 'Teams', icon: '👥' },
    { id: 'dispatch', label: 'Dispatch', icon: '🚨' },
    { id: 'notifications', label: 'Alerts', icon: '🔔' },
    { id: 'milestones', label: 'Milestones', icon: '🎯' },
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
    </div>
  )

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

  const renderCameras = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="relative bg-black aspect-video">
          {useWebcamDirect ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-green-600 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>LIVE - WEBCAM
              </div>
              <div className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded text-xs font-medium">AI: ON</div>
              <div className="absolute bottom-2 right-2"><button onClick={stopWebcam} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-medium">Stop</button></div>
            </>
          ) : (
            <>
              <img 
                src="http://localhost:8000/api/cameras/cam_001/stream" 
                alt="Live Camera Feed"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="text-gray-400 text-center w-full h-full flex items-center justify-center flex-col"><div class=\"text-4xl mb-2\">📹</div><div class=\"text-sm\">Camera Feed Loading...</div></div>';
                }}
              />
              <div className="absolute top-2 left-2 bg-green-600 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>LIVE - AI STREAM
              </div>
              <div className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded text-xs font-medium">AI: ON</div>
            </>
          )}
        </div>
        <div className="p-3 bg-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-medium">Main Camera</span>
            <span className="text-xs px-2 py-1 rounded bg-green-900 text-green-400">online</span>
          </div>
          <div className="flex gap-2">
            {!useWebcamDirect && <button onClick={startWebcam} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-medium">Use My Webcam</button>}
          </div>
        </div>
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
  )

  const renderMap = () => (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-lg font-semibold mb-4">Kenya Overwatch - Live Incident Map</h3>
      <div className="relative bg-gray-900 rounded-lg aspect-[16/9] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center"><div className="text-6xl mb-4">🗺️</div><p className="text-gray-400 text-lg">Nairobi CBD Coverage Area</p></div>
        </div>
        {incidents.filter(i => i.status === 'active').map((inc, i) => (
          <div key={inc.id} className="absolute w-4 h-4 bg-red-500 rounded-full animate-ping" style={{ top: `${30 + i * 20}%`, left: `${30 + i * 15}%` }}></div>
        ))}
        {responseTeams.filter(t => t.status === 'deployed').map((team, i) => (
          <div key={team.id} className="absolute w-4 h-4 bg-blue-500 rounded-full" style={{ top: `${50 + i * 10}%`, left: `${40 + i * 10}%` }}></div>
        ))}
        <div className="absolute bottom-4 left-4 bg-gray-800 p-3 rounded-lg text-xs">
          <div className="font-semibold mb-2">Legend</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div><span>Active Incident</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div><span>Deployed Team</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span>Available Team</span></div>
        </div>
        <div className="absolute top-4 right-4 bg-gray-800 p-3 rounded-lg text-xs">
          <div className="font-semibold mb-2">Stats</div>
          <div>Incidents: {incidents.filter(i => i.status === 'active').length}</div>
          <div>Teams Deployed: {responseTeams.filter(t => t.status === 'deployed').length}</div>
          <div>Cameras: {cameras.length}</div>
        </div>
      </div>
    </div>
  )

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
        {activeTab === 'cameras' && renderCameras()}
        {activeTab === 'map' && renderMap()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'teams' && renderTeams()}
        {activeTab === 'dispatch' && renderDispatch()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'milestones' && <MilestoneList userRole="supervisor" currentUser="operator_01" />}
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
