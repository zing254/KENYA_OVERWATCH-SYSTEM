'use client'

import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import {
  AlertTriangle, MapPin, Phone, CheckCircle, Clock, Shield,
  Navigation, ChevronRight, RefreshCw, Users, Bell, X,
  AlertCircle, MessageSquare, Send, Camera, Eye, Crosshair,
  Play, Square, Menu, LogOut, Settings, Target, Car, Plus,
  Activity, Lock, User, Radio, Siren, Zap, Volume2, VolumeX,
  FileText, Home, ChevronDown, ChevronUp, Timer, Award,
  TrendingUp, Route, Wifi, WifiOff, Battery, Signal,
  Truck, Check, MapPinIcon, Clock3
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

// API helper
async function apiCall(endpoint: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Types
interface Incident {
  id: string
  title: string
  type: string
  severity: string
  status: string
  location: string
  description: string
  created_at: string
  casualties?: number
  injuries?: number
}

interface Team {
  id: string
  name: string
  type: string
  status: string
  members: number
  base: string
}

interface Dispatch {
  id: string
  incident_id: string
  team_id: string
  status: string
  assigned_at: string
  eta?: string
}

const playBeep = (freq: number = 440) => {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.value = 0.3
    osc.start()
    setTimeout(() => { osc.stop(); ctx.close() }, 200)
  } catch {}
}

export default function ResponderApp() {
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [mounted, setMounted] = useState(false)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [currentTime, setCurrentTime] = useState('')
  const [dispatchNotes, setDispatchNotes] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string>('')

  // Responder profile
  const [profile] = useState({
    name: 'Officer Ochieng',
    badge: 'KE-2847',
    unit: 'Traffic Response',
    resolved: 47,
    rating: 4.8
  })

  useEffect(() => {
    setMounted(true)
    loadData()
    
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)
    
    // Poll for updates
    const dataInterval = setInterval(loadData, 30000)
    
    return () => {
      clearInterval(timeInterval)
      clearInterval(dataInterval)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [incData, teamData] = await Promise.all([
      apiCall('/api/incidents'),
      apiCall('/api/teams')
    ])
    
    if (incData) setIncidents(incData.incidents || incData || [])
    if (teamData) setTeams(teamData.teams || teamData || [])
    
    setLoading(false)
  }

  const handleDispatch = async () => {
    if (!selectedIncident || !selectedTeam) return
    
    const result = await apiCall('/api/dispatch', {
      method: 'POST',
      body: JSON.stringify({
        incident_id: selectedIncident.id,
        responder_id: selectedTeam,
        notes: dispatchNotes || undefined,
      })
    })
    
    if (result) {
      if (soundEnabled) playBeep(880)
      setDispatchNotes('')
      setSelectedTeam('')
      loadData()
    }
  }

  const updateIncidentStatus = async (id: string, status: string) => {
    await apiCall(`/api/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
    loadData()
  }

  const getSeverityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-black'
      default: return 'bg-green-500 text-white'
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'available': return 'bg-green-500'
      case 'busy': return 'bg-red-500'
      case 'enroute': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getTeamIcon = (type: string) => {
    switch (type) {
      case 'police': return <Car className="w-5 h-5" />
      case 'ambulance': return <Plus className="w-5 h-5" />
      case 'fire': return <Siren className="w-5 h-5" />
      case 'tow_truck': return <Truck className="w-5 h-5" />
      default: return <Users className="w-5 h-5" />
    }
  }

  const activeIncidents = incidents.filter(i => !['resolved', 'closed'].includes(i.status))
  const availableTeams = teams.filter(t => t.status === 'available')

  if (!mounted) return null

  return (
    <>
      <Head>
        <title>TAIFA RSG - Responder System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white sticky top-0 z-30 shadow-lg">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-300" />
              <div>
                <h1 className="font-bold text-sm leading-tight">TAIFA RSG</h1>
                <p className="text-blue-300/70 text-[10px]">Responder System</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-300 font-mono hidden sm:inline">{currentTime}</span>
              <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1.5 rounded hover:bg-blue-700/50">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              </button>
              <button onClick={loadData} className="p-1.5 rounded hover:bg-blue-700/50">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <nav className="flex border-t border-blue-700/50">
            {['dashboard', 'incidents', 'teams', 'profile'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs capitalize transition-colors ${
                  activeTab === tab ? 'text-white bg-blue-700/50 border-b-2 border-blue-300' : 'text-blue-300/70'
                }`}>
                {tab}
              </button>
            ))}
          </nav>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-red-400">{activeIncidents.length}</p>
                  <p className="text-xs text-gray-400">Active</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-green-400">{availableTeams.length}</p>
                  <p className="text-xs text-gray-400">Available</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-blue-400">{profile.resolved}</p>
                  <p className="text-xs text-gray-400">Resolved</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-yellow-400">{profile.rating}</p>
                  <p className="text-xs text-gray-400">Rating</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActiveTab('incidents')} className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95">
                  <AlertTriangle className="w-6 h-6" /><span className="text-sm font-medium">View Incidents</span>
                </button>
                <button onClick={() => setActiveTab('teams')} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95">
                  <Users className="w-6 h-6" /><span className="text-sm font-medium">Teams</span>
                </button>
              </div>

              {/* Recent Incidents */}
              <div className="bg-gray-800 rounded-xl border border-gray-700">
                <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm">Recent Incidents</h3>
                  <button onClick={() => setActiveTab('incidents')} className="text-blue-400 text-xs">View all →</button>
                </div>
                <div className="divide-y divide-gray-700 max-h-64 overflow-y-auto">
                  {activeIncidents.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                      <p className="text-sm">No active incidents</p>
                    </div>
                  )}
                  {activeIncidents.slice(0, 5).map(inc => (
                    <div key={inc.id} className="p-3 hover:bg-gray-750 cursor-pointer" onClick={() => { setSelectedIncident(inc); setActiveTab('incidents') }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getSeverityColor(inc.severity)}`}>
                          {inc.severity?.toUpperCase()}
                        </span>
                        <span className="text-white text-sm font-medium">{inc.title || inc.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <MapPin className="w-3 h-3" />{inc.location || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Incidents Tab */}
          {activeTab === 'incidents' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold">Active Incidents ({activeIncidents.length})</h2>
                <button onClick={loadData} className="text-blue-400 text-sm flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
              {activeIncidents.map(inc => (
                <div key={inc.id} className={`bg-gray-800 rounded-xl border ${selectedIncident?.id === inc.id ? 'border-blue-500' : 'border-gray-700'} overflow-hidden`}>
                  <div className="p-4" onClick={() => setSelectedIncident(inc)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityColor(inc.severity)}`}>{inc.severity?.toUpperCase()}</span>
                        <span className="text-gray-400 text-xs">{new Date(inc.created_at).toLocaleTimeString()}</span>
                      </div>
                      <span className="text-gray-300 text-xs capitalize">{inc.status}</span>
                    </div>
                    <h3 className="text-white font-semibold">{inc.title || inc.type}</h3>
                    <p className="text-gray-400 text-sm mt-1">{inc.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs">
                      <MapPin className="w-3 h-3" />{inc.location || 'Unknown'}
                    </div>
                  </div>
                  {selectedIncident?.id === inc.id && (
                    <div className="px-4 pb-4 border-t border-gray-700 pt-3">
                      <div className="flex gap-2 mb-3">
                        <button onClick={() => updateIncidentStatus(inc.id, 'verified')} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">Verify</button>
                        <button onClick={() => updateIncidentStatus(inc.id, 'resolved')} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500">Resolve</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div className="space-y-3 animate-fade-in">
              <h2 className="text-white font-bold">Response Teams</h2>
              {teams.map(team => (
                <div key={team.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(team.status)}`}>
                        {getTeamIcon(team.type)}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{team.name}</h3>
                        <p className="text-gray-400 text-xs capitalize">{team.type} • {team.members} members</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(team.status)} text-white capitalize`}>{team.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{team.base}</span>
                    {team.status === 'available' && selectedIncident && (
                      <button onClick={() => { setSelectedTeam(team.id); handleDispatch() }}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500">
                        Dispatch
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
                <div className="w-20 h-20 bg-blue-600/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                <p className="text-gray-400 text-sm">Badge: {profile.badge}</p>
                <p className="text-blue-400 text-xs mt-1">{profile.unit}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-green-400">{profile.resolved}</p>
                  <p className="text-xs text-gray-400">Resolved</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-yellow-400">{profile.rating}</p>
                  <p className="text-xs text-gray-400">Rating</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-blue-400">{activeIncidents.length}</p>
                  <p className="text-xs text-gray-400">Active</p>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg text-gray-300">
                  <Settings className="w-5 h-5" /> Settings
                </button>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg text-gray-300">
                  <FileText className="w-5 h-5" /> My Reports
                </button>
                <hr className="border-gray-700" />
                <button className="w-full flex items-center gap-3 p-3 hover:bg-red-900/30 rounded-lg text-red-400">
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="bg-gray-900 border-t border-gray-800 p-3 text-center">
          <p className="text-gray-500 text-xs">TAIFA RSG - Kenya Overwatch © 2026</p>
        </footer>
      </div>
    </>
  )
}
