'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import {
  AlertTriangle, MapPin, Phone, CheckCircle, Clock, Shield,
  Navigation, ChevronRight, RefreshCw, Users, Bell, X,
  AlertCircle, MessageSquare, Send, Camera, Eye, Crosshair,
  Play, Square, Menu, LogOut, Settings, Target, Car, Footprints,
  Activity, Lock, User, Radio, Siren, Zap, Volume2, VolumeX,
  FileText, Home, ChevronDown, ChevronUp, Timer, Award,
  TrendingUp, Route, Wifi, WifiOff, Battery, Signal
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

// Simple sound fallback using Web Audio API
const playFallbackBeep = (frequency: number = 440, duration: number = 200) => {
  if (typeof window === 'undefined') return
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    gainNode.gain.value = 0.3
    oscillator.start()
    setTimeout(() => {
      oscillator.stop()
      audioCtx.close()
    }, duration)
  } catch (e) { /* silently fail */ }
}

const playSound = (soundType: string, volume: number = 1.0) => {
  if (typeof window === 'undefined') return
  const sounds: Record<string, number> = {
    emergency: 880,
    alert: 660,
    warning: 550,
    notification: 440,
    incident: 770,
    dispatch: 990,
  }
  const freq = sounds[soundType] || 440
  playFallbackBeep(freq, soundType === 'emergency' ? 500 : 200)
}

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
  risk_assessment?: { risk_score: number; risk_level: string }
  phone_number?: string
  reporter_phone?: string
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

interface Dispatch {
  id: string
  incident_id: string
  team_id: string
  status: string
  assigned_at: string
  eta?: string
  distance_km?: number
}

// Mock data for demo
const MOCK_INCIDENTS: Incident[] = [
  { id: 'INC-001', title: 'Multi-Vehicle Collision', description: '3 vehicles involved on Mombasa Road', location: 'Mombasa Road Junction', severity: 'critical', status: 'new', type: 'accident', created_at: new Date(Date.now() - 300000).toISOString(), coordinates: { lat: -1.33, lng: 36.98 }, risk_assessment: { risk_score: 0.92, risk_level: 'critical' } },
  { id: 'INC-002', title: 'Pedestrian Hit', description: 'Pedestrian struck near school zone', location: 'Thika Road Stage', severity: 'high', status: 'assigned', type: 'accident', created_at: new Date(Date.now() - 600000).toISOString(), coordinates: { lat: -1.21, lng: 36.89 } },
  { id: 'INC-003', title: 'Speeding Vehicle', description: 'Vehicle detected at 140km/h in 80 zone', location: 'Uhuru Highway', severity: 'medium', status: 'dispatched', type: 'speeding', created_at: new Date(Date.now() - 900000).toISOString() },
]

const MOCK_TEAMS: Team[] = [
  { id: 'team_001', name: 'Alpha Response', status: 'available', base: 'CBD Station', members: 4, type: 'police', capabilities: ['patrol', 'pursuit', 'crowd_control'] },
  { id: 'team_002', name: 'Medical Unit 1', status: 'available', base: 'KNH Base', members: 3, type: 'ambulance', capabilities: ['emergency_medical', 'transport'] },
  { id: 'team_003', name: 'Fire Response', status: 'busy', base: 'Fire Station Central', members: 6, type: 'fire', capabilities: ['fire_response', 'rescue', 'hazmat'] },
  { id: 'team_004', name: 'Traffic Unit', status: 'available', base: 'Traffic HQ', members: 2, type: 'police', capabilities: ['traffic_control', 'accident_investigation'] },
]

export default function ResponderApp() {
  const [activeView, setActiveView] = useState<'dashboard' | 'incidents' | 'map' | 'dispatch' | 'profile'>('dashboard')
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS)
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [notifications, setNotifications] = useState<number>(3)
  const [isOnline, setIsOnline] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [selectedTeamForDispatch, setSelectedTeamForDispatch] = useState<string>('')
  const [expandIncident, setExpandIncident] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // Update time
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('en-KE', { 
        timeZone: 'Africa/Nairobi', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)
    
    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Battery API (if available)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100))
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100))
        })
      }).catch(() => {})
    }
    
    // Simulate new incidents
    const incidentInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        const newIncident: Incident = {
          id: `INC-${Date.now().toString().slice(-4)}`,
          title: 'New Traffic Alert',
          description: 'Automated detection - incident reported',
          location: 'Nairobi CBD Area',
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          status: 'new',
          type: 'accident',
          created_at: new Date().toISOString()
        }
        setIncidents(prev => [newIncident, ...prev])
        setNotifications(prev => prev + 1)
        if (soundEnabled) playSound('notification')
      }
    }, 30000)
    
    return () => {
      clearInterval(timeInterval)
      clearInterval(incidentInterval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [soundEnabled])

  const handleDispatch = useCallback((incidentId: string, teamId: string) => {
    const dispatch: Dispatch = {
      id: `DSP-${Date.now().toString().slice(-4)}`,
      incident_id: incidentId,
      team_id: teamId,
      status: 'dispatched',
      assigned_at: new Date().toISOString(),
      eta: '5 min'
    }
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, status: 'enroute' } : t))
    setIncidents(prev => prev.map(i => i.id === incidentId ? { ...i, status: 'dispatched' } : i))
    setDispatchModalOpen(false)
    setSelectedTeamForDispatch('')
    if (soundEnabled) playSound('dispatch')
    // Show success feedback
    alert(`Dispatched ${teams.find(t => t.id === teamId)?.name} to incident ${incidentId}`)
  }, [teams, soundEnabled])

  const handleStatusUpdate = (incidentId: string, newStatus: string) => {
    setIncidents(prev => prev.map(i => i.id === incidentId ? { ...i, status: newStatus } : i))
    if (soundEnabled) playSound('notification')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white animate-pulse'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-black'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'assigned': return 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      case 'dispatched': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'on_scene': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'resolved': return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getTeamStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'busy': return 'bg-red-500'
      case 'enroute': return 'bg-orange-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getTeamIcon = (type: string) => {
    switch (type) {
      case 'police': return <Car className="w-5 h-5" />
      case 'ambulance': return <Cross className="w-5 h-5" />
      case 'fire': return <Siren className="w-5 h-5" />
      default: return <Users className="w-5 h-5" />
    }
  }

  if (!mounted) return null

  return (
    <>
      <Head>
        <title>TAIFA RSG - Responder System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#1e3a5f" />
      </Head>

      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white sticky top-0 z-30 shadow-lg">
          <div className="px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-300" />
              <div>
                <h1 className="font-bold text-sm leading-tight">TAIFA RSG</h1>
                <p className="text-blue-300/70 text-[10px]">Responder System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* System status indicators */}
              <div className="hidden sm:flex items-center gap-2 mr-2">
                {isOnline ? (
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <Wifi className="w-3 h-3" /> <span className="hidden md:inline">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400 text-xs animate-pulse">
                    <WifiOff className="w-3 h-3" /> <span className="hidden md:inline">Offline</span>
                  </div>
                )}
                {batteryLevel !== null && (
                  <div className="flex items-center gap-1 text-xs text-gray-300">
                    <Battery className="w-3 h-3" /> {batteryLevel}%
                  </div>
                )}
                <span className="text-xs text-gray-300 font-mono">{currentTime}</span>
              </div>
              
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 hover:bg-blue-700/50 rounded-lg transition-colors"
                title={soundEnabled ? 'Sound On' : 'Sound Off'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              </button>
              
              <button
                onClick={() => setNotifications(0)}
                className="relative p-1.5 hover:bg-blue-700/50 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center animate-bounce">
                    {notifications}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex border-t border-blue-700/50">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: incidents.filter(i => i.status === 'new').length },
              { id: 'map', label: 'Map', icon: MapPin },
              { id: 'dispatch', label: 'Teams', icon: Radio, badge: teams.filter(t => t.status === 'available').length },
              { id: 'profile', label: 'Profile', icon: User },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] transition-all duration-200 relative ${
                  activeView === tab.id
                    ? 'text-white bg-blue-700/50 border-b-2 border-blue-300'
                    : 'text-blue-300/70 hover:text-white hover:bg-blue-700/30'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute top-1 right-1/4 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {/* Dashboard */}
          {activeView === 'dashboard' && (
            <div className="p-4 space-y-4 animate-fade-in">
              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 text-center">
                  <p className="text-2xl font-bold text-red-400">{incidents.filter(i => i.status === 'new').length}</p>
                  <p className="text-xs text-gray-400">New</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 text-center">
                  <p className="text-2xl font-bold text-orange-400">{incidents.filter(i => i.status === 'dispatched').length}</p>
                  <p className="text-xs text-gray-400">Dispatched</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 text-center">
                  <p className="text-2xl font-bold text-green-400">{teams.filter(t => t.status === 'available').length}</p>
                  <p className="text-xs text-gray-400">Available</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 text-center">
                  <p className="text-2xl font-bold text-blue-400">{teams.length}</p>
                  <p className="text-xs text-gray-400">Total Teams</p>
                </div>
              </div>

              {/* Active incidents */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    Active Incidents
                  </h3>
                  <button onClick={() => setActiveView('incidents')} className="text-blue-400 text-xs">
                    View all →
                  </button>
                </div>
                <div className="divide-y divide-gray-700 max-h-64 overflow-y-auto">
                  {incidents.filter(i => !['resolved'].includes(i.status)).slice(0, 5).map(incident => (
                    <div key={incident.id} className="p-3 hover:bg-gray-750 transition-colors">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getSeverityColor(incident.severity)}`}>
                            {incident.severity.toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${getStatusColor(incident.status)}`}>
                            {incident.status}
                          </span>
                        </div>
                        <span className="text-gray-500 text-[10px]">
                          {new Date(incident.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium">{incident.title}</p>
                      <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {incident.location}
                      </p>
                    </div>
                  ))}
                  {incidents.filter(i => !['resolved'].includes(i.status)).length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                      <p className="text-sm">All clear!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveView('incidents')}
                  className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-xl flex items-center gap-3 transition-all duration-200 active:scale-95"
                >
                  <AlertTriangle className="w-6 h-6" />
                  <span className="text-sm font-medium">View Incidents</span>
                </button>
                <button
                  onClick={() => setActiveView('dispatch')}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl flex items-center gap-3 transition-all duration-200 active:scale-95"
                >
                  <Radio className="w-6 h-6" />
                  <span className="text-sm font-medium">Dispatch Teams</span>
                </button>
              </div>
            </div>
          )}

          {/* Incidents List */}
          {activeView === 'incidents' && (
            <div className="p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Incidents</h2>
                <button onClick={() => setIncidents(MOCK_INCIDENTS)} className="text-blue-400 text-sm flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
              
              {incidents.map(incident => (
                <div key={incident.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <div 
                    onClick={() => setExpandIncident(expandIncident === incident.id ? null : incident.id)}
                    className="p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                          {incident.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {new Date(incident.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold">{incident.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{incident.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs">
                      <MapPin className="w-3 h-3" /> {incident.location}
                    </div>
                    <div className="flex justify-end mt-2">
                      {expandIncident === incident.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                  
                  {expandIncident === incident.id && (
                    <div className="px-4 pb-4 border-t border-gray-700 pt-3 animate-fade-in">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          onClick={() => { setSelectedIncident(incident); setActiveView('dispatch') }}
                          className="py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
                        >
                          Dispatch Team
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(incident.id, 'resolved')}
                          className="py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p><strong>ID:</strong> {incident.id}</p>
                        <p><strong>Type:</strong> {incident.type}</p>
                        <p><strong>Created:</strong> {new Date(incident.created_at).toLocaleString('en-KE')}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Map View */}
          {activeView === 'map' && (
            <div className="h-full animate-fade-in">
              <div className="p-4 bg-gray-800 border-b border-gray-700">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  Incident Map
                </h2>
              </div>
              <div className="h-96 bg-gray-800 m-4 rounded-xl border border-gray-700 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-blue-400" />
                  <p>Map View</p>
                  <p className="text-xs mt-1">{incidents.length} incidents on map</p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <h3 className="text-white font-semibold mb-2">Incidents on Map</h3>
                <div className="space-y-2">
                  {incidents.filter(i => i.coordinates).map(incident => (
                    <div key={incident.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg border border-gray-700">
                      <span className={`w-3 h-3 rounded-full ${getSeverityColor(incident.severity).split(' ')[0]}`} />
                      <span className="text-white text-sm flex-1">{incident.title}</span>
                      <span className="text-gray-500 text-xs">{incident.location}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dispatch / Teams */}
          {activeView === 'dispatch' && (
            <div className="p-4 space-y-3 animate-fade-in">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-400" />
                Response Teams
              </h2>
              
              {teams.map(team => (
                <div key={team.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getTeamStatusColor(team.status)}`}>
                        {getTeamIcon(team.type)}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{team.name}</h3>
                        <p className="text-gray-400 text-xs capitalize">{team.type} • {team.members} members</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${getTeamStatusColor(team.status)} text-white capitalize`}>
                      {team.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {team.base}
                    </span>
                    {team.status === 'available' && selectedIncident && (
                      <button
                        onClick={() => handleDispatch(selectedIncident.id, team.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
                      >
                        Dispatch
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {team.capabilities.map((cap, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-700 rounded text-[10px] text-gray-300">{cap}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Profile */}
          {activeView === 'profile' && (
            <div className="p-4 space-y-4 animate-fade-in">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
                <div className="w-20 h-20 bg-blue-600/30 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-blue-500/20">
                  <User className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Officer Ochieng</h2>
                <p className="text-gray-400 text-sm">Badge: #KE-2847</p>
                <p className="text-blue-400 text-xs mt-1">Traffic Response Unit</p>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-green-400">47</p>
                  <p className="text-xs text-gray-400">Resolved</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-yellow-400">4.8</p>
                  <p className="text-xs text-gray-400">Rating</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-blue-400">12</p>
                  <p className="text-xs text-gray-400">Active</p>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white">
                  <Settings className="w-5 h-5" /> Settings
                </button>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white">
                  <FileText className="w-5 h-5" /> My Reports
                </button>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white">
                  <Lock className="w-5 h-5" /> Change Password
                </button>
                <hr className="border-gray-700" />
                <button className="w-full flex items-center gap-3 p-3 hover:bg-red-900/30 rounded-lg transition-colors text-red-400">
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 p-3 text-center">
          <p className="text-gray-500 text-xs">TAIFA RSG © 2026 Kenya Overwatch</p>
        </footer>
      </div>
    </>
  )
}
