'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Bell, AlertTriangle, AlertCircle, MapPin, Send, Play, Pause, RefreshCw, Users, Camera, Activity, Shield, FileText, Settings, Radio, Map, BarChart3, MessageSquare, Zap } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

interface Incident {
  id: string
  type: string
  title: string
  description: string
  location: string
  coordinates: { lat: number; lng: number }
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'responding' | 'resolved' | 'under_review'
  risk_score: number
  created_at: string
}

interface Camera {
  id: string
  name: string
  location: string
  status: string
  risk_score: number
  detections: number
}

interface Alert {
  id: string
  type: string
  message: string
  severity: string
  timestamp: string
  read: boolean
}

interface Team {
  id: string
  name: string
  status: string
  location: string
  members: number
}

const mockIncidents: Incident[] = [
  { id: 'inc_001', type: 'suspicious_activity', title: 'Suspicious Vehicle', description: 'Unregistered vehicle near bank', location: 'Nairobi CBD', coordinates: { lat: -1.2864, lng: 36.8232 }, severity: 'high', status: 'active', risk_score: 0.85, created_at: new Date().toISOString() },
  { id: 'inc_002', type: 'theft', title: 'Theft Attempt', description: 'Shoplifting reported', location: 'Westlands', coordinates: { lat: -1.2644, lng: 36.8019 }, severity: 'medium', status: 'responding', risk_score: 0.65, created_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'inc_003', type: 'traffic', title: 'Road Accident', description: 'Minor collision reported', location: 'Kenyatta Avenue', coordinates: { lat: -1.2921, lng: 36.8219 }, severity: 'low', status: 'resolved', risk_score: 0.30, created_at: new Date(Date.now() - 600000).toISOString() },
  { id: 'inc_004', type: 'security', title: 'Trespassing', description: 'Unauthorized entry detected', location: 'Industrial Area', coordinates: { lat: -1.3024, lng: 36.8412 }, severity: 'high', status: 'active', risk_score: 0.78, created_at: new Date(Date.now() - 900000).toISOString() },
]

const mockCameras: Camera[] = [
  { id: 'cam_001', name: 'CBD Main', location: 'Kenyatta Ave', status: 'online', risk_score: 0.45, detections: 23 },
  { id: 'cam_002', name: 'Westlands', location: 'Westlands Roundabout', status: 'online', risk_score: 0.62, detections: 18 },
  { id: 'cam_003', name: 'Airport', location: 'Jomo Kenyatta Intl', status: 'online', risk_score: 0.33, detections: 45 },
  { id: 'cam_004', name: 'Railway', location: 'Central Railway', status: 'maintenance', risk_score: 0.00, detections: 0 },
  { id: 'cam_005', name: 'Industrial', location: 'Industrial Area', status: 'online', risk_score: 0.71, detections: 12 },
  { id: 'cam_006', name: 'Nakuru', location: 'Nakuru Town', status: 'online', risk_score: 0.28, detections: 8 },
]

const mockAlerts: Alert[] = [
  { id: 'alert_001', type: 'risk', message: 'High risk activity detected at CBD Main', severity: 'high', timestamp: new Date().toISOString(), read: false },
  { id: 'alert_002', type: 'system', message: 'Camera cam_004 went offline', severity: 'medium', timestamp: new Date(Date.now() - 180000).toISOString(), read: true },
  { id: 'alert_003', type: 'incident', message: 'New incident reported in Westlands', severity: 'low', timestamp: new Date(Date.now() - 300000).toISOString(), read: true },
]

const mockTeams: Team[] = [
  { id: 'team_001', name: 'Alpha Response', status: 'available', location: 'CBD', members: 4 },
  { id: 'team_002', name: 'Bravo Patrol', status: 'deployed', location: 'Westlands', members: 3 },
  { id: 'team_003', name: 'Charlie Rapid', status: 'available', location: 'Airport', members: 5 },
  { id: 'team_004', name: 'Delta Support', status: 'resting', location: 'Central', members: 4 },
]

const chartData = [
  { name: '00:00', incidents: 3, resolved: 2 },
  { name: '04:00', incidents: 1, resolved: 1 },
  { name: '08:00', incidents: 8, resolved: 5 },
  { name: '12:00', incidents: 12, resolved: 10 },
  { name: '16:00', incidents: 15, resolved: 12 },
  { name: '20:00', incidents: 9, resolved: 7 },
  { name: '24:00', incidents: 5, resolved: 4 },
]

const severityData = [
  { name: 'Critical', value: 4, color: '#ef4444' },
  { name: 'High', value: 12, color: '#f97316' },
  { name: 'Medium', value: 25, color: '#eab308' },
  { name: 'Low', value: 35, color: '#22c55e' },
]

export default function ProductionDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents)
  const [cameras] = useState<Camera[]>(mockCameras)
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [teams] = useState<Team[]>(mockTeams)
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let ws: WebSocket | null = null
    
    const connectWebSocket = () => {
      try {
        const wsUrl = `ws://${API_URL.replace('http://', '').replace('https://', '')}/ws/control_center`
        ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log('Control Center WebSocket connected')
          ws?.send(JSON.stringify({ type: 'subscribe', channels: ['incidents', 'alerts', 'cameras'] }))
        }
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'new_incident' || data.type === 'incident_update') {
              setIncidents(prev => {
                const updated = data.incident || data
                const filtered = prev.filter(i => i.id !== updated.id)
                return [updated, ...filtered]
              })
            } else if (data.type === 'new_alert') {
              setAlerts(prev => [data.alert, ...prev])
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
        
        ws.onclose = () => {
          setTimeout(connectWebSocket, 5000)
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error)
      }
    }
    
    connectWebSocket()
    
    return () => {
      if (ws) ws.close()
    }
  }, [API_URL])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-400'
      case 'responding': return 'text-yellow-400'
      case 'resolved': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--'
    return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '...'
    return date.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const unreadCount = alerts.filter(a => !a.read).length

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Incidents</p>
              <p className="text-3xl font-bold text-white mt-1">{incidents.filter(i => i.status === 'active').length}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Cameras Online</p>
              <p className="text-3xl font-bold text-white mt-1">{cameras.filter(c => c.status === 'online').length}/{cameras.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Response Teams</p>
              <p className="text-3xl font-bold text-white mt-1">{teams.filter(t => t.status === 'available').length} available</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">System Health</p>
              <p className="text-3xl font-bold text-green-400 mt-1">98.5%</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Incidents Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="incidents" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
              <Area type="monotone" dataKey="resolved" stackId="2" stroke="#22C55E" fill="#22C55E" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">By Severity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Incidents</h3>
        <div className="space-y-3">
          {incidents.slice(0, 5).map(incident => (
            <div key={incident.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${getSeverityColor(incident.severity)}`} />
                <div>
                  <p className="text-white font-medium">{incident.title}</p>
                  <p className="text-gray-400 text-sm">{incident.location}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${getStatusColor(incident.status)}`}>{incident.status}</p>
                <p className="text-gray-500 text-xs">{new Date(incident.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderCameras = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cameras.map(camera => (
        <div key={camera.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          <div className="aspect-video bg-black relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-600" />
            </div>
            <div className="absolute top-2 left-2 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-white text-xs">{camera.status}</span>
            </div>
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-1 rounded text-xs ${camera.risk_score > 0.6 ? 'bg-red-600' : camera.risk_score > 0.3 ? 'bg-yellow-600' : 'bg-green-600'}`}>
                Risk: {Math.round(camera.risk_score * 100)}%
              </span>
            </div>
          </div>
          <div className="p-4">
            <h4 className="text-white font-semibold">{camera.name}</h4>
            <p className="text-gray-400 text-sm">{camera.location}</p>
            <div className="flex justify-between mt-3 text-sm">
              <span className="text-gray-500">Detections: {camera.detections}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderIncidents = () => (
    <div className="space-y-4">
      {incidents.map(incident => (
        <div key={incident.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-2 ${getSeverityColor(incident.severity)}`} />
              <div>
                <h4 className="text-white font-semibold">{incident.title}</h4>
                <p className="text-gray-400 text-sm mt-1">{incident.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {incident.location}</span>
                  <span>{new Date(incident.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)} text-white`}>
              {incident.severity}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              View Details
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">
              Assign Team
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">
              Evidence
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const renderTeams = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {teams.map(team => (
        <div key={team.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-semibold">{team.name}</h4>
              <p className="text-gray-400 text-sm">{team.location}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              team.status === 'available' ? 'bg-green-600' : team.status === 'deployed' ? 'bg-yellow-600' : 'bg-gray-600'
            } text-white`}>
              {team.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Users className="w-4 h-4" /> {team.members} members
            </div>
            {team.status === 'available' && (
              <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm ml-auto">
                Deploy
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  const renderAlerts = () => (
    <div className="space-y-3">
      {alerts.map(alert => (
        <div key={alert.id} className={`p-4 rounded-xl border ${alert.read ? 'bg-gray-800 border-gray-700' : 'bg-gray-800 border-blue-500'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 mt-0.5 ${alert.severity === 'high' ? 'text-red-400' : 'text-yellow-400'}`} />
              <div>
                <p className="text-white">{alert.message}</p>
                <p className="text-gray-500 text-sm mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
              </div>
            </div>
            {!alert.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
          </div>
        </div>
      ))}
    </div>
  )

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'cameras', label: 'Cameras', icon: Camera },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Kenya Overwatch</h1>
            <p className="text-gray-400 text-sm">Nairobi Metropolitan Surveillance System</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-white font-medium">{formatDate(currentTime)}</p>
              <p className="text-blue-400 text-xl font-mono">{formatTime(currentTime)}</p>
            </div>
            <button className="relative p-2 hover:bg-gray-700 rounded-lg">
              <Bell className="w-6 h-6 text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'cameras' && renderCameras()}
        {activeTab === 'incidents' && renderIncidents()}
        {activeTab === 'teams' && renderTeams()}
        {activeTab === 'alerts' && renderAlerts()}
      </main>
    </div>
  )
}
