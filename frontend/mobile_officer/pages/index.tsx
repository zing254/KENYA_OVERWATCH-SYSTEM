'use client'

import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  CheckCircle, 
  Clock, 
  Shield,
  Navigation,
  ChevronRight,
  RefreshCw,
  Users,
  Bell,
  X,
  AlertCircle,
  MessageSquare,
  Send,
  Camera,
  Eye,
  Crosshair,
  Play,
  Square,
  Menu,
  LogOut,
  Settings,
  Target,
  Car,
  Footprints,
  Activity
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const MobileMap = dynamic(() => import('../components/MobileMap'), { ssr: false })

interface Incident {
  id: string
  title: string
  description: string
  location: string
  coordinates?: { lat: number; lng: number }
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: string
  type: string
  created_at: string
  risk_assessment?: {
    risk_score: number
    risk_level: string
  }
}

interface Team {
  id: string
  name: string
  status: string
  base: string
  members: number
  location?: { lat: number; lng: number }
  type: string
  capabilities: string[]
}

interface Notification {
  id: string
  title: string
  message: string
  severity: string
  created_at: string
}

interface Dispatch {
  id: string
  incident_id: string
  team_id: string
  status: string
  priority: string
  assigned_at: string
  eta?: string
}

export default function ResponderApp() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [chatMessages, setChatMessages] = useState<{id: string; sender: string; message: string; timestamp: string; type: string}[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [myTeam, setMyTeam] = useState<Team | null>(null)
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [myLocation, setMyLocation] = useState<{lat: number; lng: number} | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null)
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number}>({ lat: -1.2921, lng: 36.8219 })
  const [mapZoom, setMapZoom] = useState(13)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [incidentsRes, teamsRes, notifRes, dispatchRes] = await Promise.all([
        fetch(`${API_URL}/api/incidents`).catch(() => ({ json: () => [] })),
        fetch(`${API_URL}/api/teams`).catch(() => ({ json: () => ({ teams: [] }) })),
        fetch(`${API_URL}/api/notifications`).catch(() => ({ json: () => ({ notifications: [] }) })),
        fetch(`${API_URL}/api/dispatch`).catch(() => ({ json: () => ({ dispatches: [] }) }))
      ])
      
      const incidentsData = await incidentsRes.json()
      const teamsData = await teamsRes.json()
      const notifData = await notifRes.json()
      const dispatchData = await dispatchRes.json()
      
      setIncidents(Array.isArray(incidentsData) ? incidentsData : incidentsData?.incidents || [])
      setTeams(teamsData?.teams || [])
      setMyTeam(teamsData?.teams?.[0] || null)
      setNotifications(notifData?.notifications || [])
      setDispatches(dispatchData?.dispatches || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMyLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => console.error('Geolocation error:', error)
      )
    }
  }, [])

  const updateIncidentStatus = async (incidentId: string, status: string) => {
    setUpdatingStatus(true)
    try {
      await fetch(`${API_URL}/api/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      fetchData()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
    setUpdatingStatus(false)
  }

  const dispatchTeam = async (teamId: string, incidentId: string) => {
    try {
      await fetch(`${API_URL}/api/teams/${teamId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: incidentId, priority: 'high' })
      })
      fetchData()
    } catch (error) {
      console.error('Failed to dispatch team:', error)
    }
  }

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
      case 'active': return 'bg-red-500'
      case 'responding': return 'bg-blue-500'
      case 'resolved': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return
    setChatMessages([...chatMessages, {
      id: Date.now().toString(),
      sender: 'You',
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'outgoing'
    }])
    setNewMessage('')
  }

  const centerOnMyLocation = () => {
    if (myLocation) {
      setMapCenter(myLocation)
      setMapZoom(15)
    }
  }

  const navigateToIncident = (incident: Incident) => {
    if (incident.coordinates) {
      setMapCenter(incident.coordinates)
      setMapZoom(16)
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Shield },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ]

  const activeIncidents = incidents.filter(i => i.status === 'active')
  const myDispatches = dispatches.filter(d => d.team_id === myTeam?.id || d.status !== 'resolved')

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Kenya Overwatch - Responder</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </Head>

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-1 hover:bg-gray-700 rounded">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              <span className="font-bold hidden sm:inline">Responder</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-700 rounded"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => n.severity === 'critical' || n.severity === 'high').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {notifications.filter(n => n.severity === 'critical' || n.severity === 'high').length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${isTracking ? 'bg-green-500' : 'bg-gray-500'}`}></span>
              <span className="text-sm text-gray-400 hidden sm:inline">{isTracking ? 'Tracking' : 'Offline'}</span>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-2 text-xs font-medium flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === tab.id ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700' : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden xs:inline">{tab.label}</span>
              {tab.id === 'incidents' && activeIncidents.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {activeIncidents.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowSidebar(false)}></div>
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-gray-800 p-4 transform transition-transform">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Menu</h2>
              <button onClick={() => setShowSidebar(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              <button onClick={() => { setActiveTab('dashboard'); setShowSidebar(false) }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg">
                <Shield className="w-5 h-5 text-blue-400" /> Dashboard
              </button>
              <button onClick={() => { setActiveTab('incidents'); setShowSidebar(false) }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" /> Incidents
              </button>
              <button onClick={() => { setActiveTab('map'); setShowSidebar(false) }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg">
                <MapPin className="w-5 h-5 text-green-400" /> Map
              </button>
              <button onClick={() => { setActiveTab('team'); setShowSidebar(false) }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg">
                <Users className="w-5 h-5 text-purple-400" /> My Team
              </button>
              <button onClick={() => { setActiveTab('chat'); setShowSidebar(false) }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg">
                <MessageSquare className="w-5 h-5 text-yellow-400" /> Chat
              </button>
              <hr className="border-gray-700 my-4" />
              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg">
                <Settings className="w-5 h-5" /> Settings
              </button>
              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg text-red-400">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" onClick={() => setShowNotifications(false)}>
          <div className="bg-gray-800 w-full max-w-md rounded-2xl p-4 max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-400" />
                Notifications
              </h2>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No notifications</p>
              ) : (
                notifications.slice(0, 10).map(notif => (
                  <div key={notif.id} className={`p-3 rounded-lg ${
                    notif.severity === 'critical' ? 'bg-red-900 border border-red-600' :
                    notif.severity === 'high' ? 'bg-orange-900 border border-orange-600' :
                    'bg-gray-700'
                  }`}>
                    <div className="flex items-start gap-2">
                      <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        notif.severity === 'critical' ? 'text-red-400' :
                        notif.severity === 'high' ? 'text-orange-400' : 'text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{notif.title}</div>
                        <div className="text-xs text-gray-400 mt-1">{notif.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-2 sm:p-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : activeTab === 'dashboard' ? (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <AlertTriangle className="w-3 h-3" /> Active
                </div>
                <div className="text-2xl font-bold text-red-400">{activeIncidents.length}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Navigation className="w-3 h-3" /> Dispatched
                </div>
                <div className="text-2xl font-bold text-blue-400">{myDispatches.length}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Users className="w-3 h-3" /> Team
                </div>
                <div className="text-2xl font-bold text-purple-400">{myTeam?.members || 0}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Bell className="w-3 h-3" /> Alerts
                </div>
                <div className="text-2xl font-bold text-yellow-400">{notifications.length}</div>
              </div>
            </div>

            {/* My Team Status */}
            {myTeam && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{myTeam.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    myTeam.status === 'available' ? 'bg-green-900 text-green-400' :
                    myTeam.status === 'deployed' ? 'bg-blue-900 text-blue-400' : 'bg-red-900 text-red-400'
                  }`}>
                    {myTeam.status?.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Base: <span className="text-white">{myTeam.base}</span></div>
                  <div className="text-gray-400">Members: <span className="text-white">{myTeam.members}</span></div>
                  <div className="text-gray-400">Type: <span className="text-white">{myTeam.type}</span></div>
                  <div className="text-gray-400">Capabilities: <span className="text-white">{myTeam.capabilities?.join(', ')}</span></div>
                </div>
              </div>
            )}

            {/* Active Dispatches */}
            {myDispatches.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-400" /> My Dispatches
                </h3>
                <div className="space-y-2">
                  {myDispatches.map(dispatch => {
                    const incident = incidents.find(i => i.id === dispatch.incident_id)
                    return (
                      <div 
                        key={dispatch.id}
                        onClick={() => { setSelectedIncident(incident || null); setActiveTab('incidents') }}
                        className="bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-600"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(dispatch.status)}`}>
                            {dispatch.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">{dispatch.priority} priority</span>
                        </div>
                        <div className="text-sm font-medium">{incident?.title || dispatch.incident_id}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          ETA: {dispatch.eta || 'Calculating...'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent Incidents */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Recent Incidents</h3>
                <button onClick={fetchData} className="text-blue-400 text-sm flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <div className="space-y-2">
                {activeIncidents.slice(0, 5).map(incident => (
                  <div 
                    key={incident.id}
                    onClick={() => { setSelectedIncident(incident); setActiveTab('incidents') }}
                    className="bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-600"
                    style={{ borderLeft: `3px solid ${incident.severity === 'critical' ? '#dc2626' : incident.severity === 'high' ? '#ea580c' : '#ca8a04'}`}}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">{incident.type}</span>
                    </div>
                    <div className="text-sm font-medium mt-1">{incident.title}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <MapPin className="w-3 h-3" /> {incident.location}
                    </div>
                  </div>
                ))}
                {activeIncidents.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    No active incidents
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={centerOnMyLocation}
                className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg flex flex-col items-center gap-2"
              >
                <Crosshair className="w-6 h-6 text-blue-400" />
                <span className="text-sm font-medium">My Location</span>
              </button>
              <button 
                onClick={() => setActiveTab('map')}
                className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg flex flex-col items-center gap-2"
              >
                <MapPin className="w-6 h-6 text-green-400" />
                <span className="text-sm font-medium">View Map</span>
              </button>
            </div>
          </div>
        ) : activeTab === 'incidents' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Active Incidents</h2>
              <button onClick={fetchData} className="text-sm text-blue-400 flex items-center gap-1">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            {activeIncidents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No active incidents</p>
              </div>
            ) : (
              activeIncidents.map(incident => (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-750 ${
                    selectedIncident?.id === incident.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{ borderLeft: `4px solid ${incident.severity === 'critical' ? '#dc2626' : incident.severity === 'high' ? '#ea580c' : '#ca8a04'}`}}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">{incident.type}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="font-medium mb-1">{incident.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{incident.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <Clock className="w-3 h-3" />
                    {new Date(incident.created_at).toLocaleTimeString()}
                  </div>
                  {incident.risk_assessment && (
                    <div className="mt-2 text-xs">
                      <span className="text-gray-400">Risk: </span>
                      <span className={`font-medium ${
                        incident.risk_assessment.risk_level === 'critical' ? 'text-red-400' :
                        incident.risk_assessment.risk_level === 'high' ? 'text-orange-400' : 'text-yellow-400'
                      }`}>
                        {incident.risk_assessment.risk_score?.toFixed(2)} ({incident.risk_assessment.risk_level})
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'map' ? (
          <div className="space-y-3">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-2 bg-gray-700 flex items-center justify-between">
                <h2 className="font-semibold">Nairobi Incident Map</h2>
                <div className="flex gap-2">
                  <button onClick={centerOnMyLocation} className="p-2 bg-gray-600 rounded hover:bg-gray-500">
                    <Crosshair className="w-4 h-4" />
                  </button>
                  <button onClick={fetchData} className="p-2 bg-gray-600 rounded hover:bg-gray-500">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="h-[60vh] relative">
                <MobileMap 
                  center={mapCenter}
                  zoom={mapZoom}
                  incidents={incidents}
                  teams={teams}
                  myLocation={myLocation}
                  onIncidentClick={(inc) => { setSelectedIncident(inc); setActiveTab('incidents') }}
                  onTeamClick={(team) => console.log('Team:', team)}
                />
              </div>
            </div>
            
            {/* Map Legend */}
            <div className="bg-gray-800 rounded-lg p-3">
              <h3 className="text-sm font-medium mb-2">Map Legend</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span> Critical
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-orange-500 rounded-full"></span> High
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span> My Team
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span> My Location
                </div>
              </div>
            </div>

            {/* Quick List */}
            <div className="bg-gray-800 rounded-lg p-3">
              <h3 className="text-sm font-medium mb-2">Nearby Incidents</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activeIncidents.slice(0, 8).map(incident => (
                  <div 
                    key={incident.id}
                    onClick={() => { setSelectedIncident(incident); navigateToIncident(incident) }}
                    className="bg-gray-700 p-2 rounded cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity[0].toUpperCase()}
                      </span>
                      <span className="ml-2 text-sm">{incident.title}</span>
                    </div>
                    <Navigation className="w-3 h-3 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'team' ? (
          <div className="space-y-4">
            {myTeam ? (
              <>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">{myTeam.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      myTeam.status === 'available' ? 'bg-green-900 text-green-400' :
                      myTeam.status === 'deployed' ? 'bg-blue-900 text-blue-400' : 'bg-red-900 text-red-400'
                    }`}>
                      {myTeam.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Base</p>
                      <p>{myTeam.base}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Members</p>
                      <p>{myTeam.members} officers</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Type</p>
                      <p className="capitalize">{myTeam.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Capabilities</p>
                      <p>{myTeam.capabilities?.join(', ')}</p>
                    </div>
                  </div>
                </div>

                {/* All Teams */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium mb-3">All Response Teams</h3>
                  <div className="space-y-2">
                    {teams.map(team => (
                      <div key={team.id} className="bg-gray-700 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{team.name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            team.status === 'available' ? 'bg-green-900 text-green-400' :
                            team.status === 'deployed' ? 'bg-blue-900 text-blue-400' : 'bg-red-900 text-red-400'
                          }`}>
                            {team.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{team.members} members | {team.base}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                      <Navigation className="w-4 h-4" />
                      Navigate to Base
                    </button>
                    <button className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact Dispatch
                    </button>
                    <button className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                      <Settings className="w-4 h-4" />
                      Team Settings
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3" />
                <p>No team assigned</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Communication</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="bg-gray-900 rounded-lg p-3 h-[60vh] overflow-y-auto space-y-2 mb-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                    <p>No messages from dispatch</p>
                    <p className="text-xs mt-2">Messages will appear here</p>
                  </div>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className={`p-2 rounded-lg ${
                      msg.type === 'outgoing' ? 'bg-blue-900 ml-8' : 'bg-gray-700 mr-8'
                    }`}>
                      <div className="text-xs text-blue-400 font-medium">{msg.sender}</div>
                      <div className="text-sm">{msg.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
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
                  placeholder="Message dispatch..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end" onClick={() => setSelectedIncident(null)}>
          <div className="bg-gray-800 w-full rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(selectedIncident.severity)}`}>
                  {selectedIncident.severity.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400">{selectedIncident.type}</span>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <h2 className="text-xl font-bold mb-2">{selectedIncident.title}</h2>
            <p className="text-gray-300 mb-4">{selectedIncident.description}</p>
            
            <div className="bg-gray-700 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm mb-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{selectedIncident.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{new Date(selectedIncident.created_at).toLocaleString()}</span>
              </div>
              {selectedIncident.risk_assessment && (
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <div className="text-sm">
                    <span className="text-gray-400">Risk Score: </span>
                    <span className={`font-bold ${
                      selectedIncident.risk_assessment.risk_level === 'critical' ? 'text-red-400' :
                      selectedIncident.risk_level === 'high' ? 'text-orange-400' : 'text-yellow-400'
                    }`}>
                      {selectedIncident.risk_assessment.risk_score?.toFixed(2)}
                    </span>
                    <span className="text-gray-400 ml-2">({selectedIncident.risk_assessment.risk_level})</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => { updateIncidentStatus(selectedIncident.id, 'responding'); setSelectedIncident(null) }}
                disabled={updatingStatus}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Navigation className="w-4 h-4" />
                Accept & Respond
              </button>
              <button 
                onClick={() => { updateIncidentStatus(selectedIncident.id, 'resolved'); setSelectedIncident(null) }}
                disabled={updatingStatus}
                className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Resolved
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { navigateToIncident(selectedIncident); setActiveTab('map') }}
                  className="bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Show on Map
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call
                </button>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
