'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Users, MapPin, Phone, Clock, CheckCircle, AlertCircle, Send, X, Navigation, Shield, Car, AlertTriangle, RefreshCw } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Team {
  id: string
  name: string
  type: string
  status: 'available' | 'deployed' | 'off_duty'
  location: { lat: number; lng: number }
  base: string
  members: number
  vehicles: number
  capabilities: string[]
  current_incident: string | null
  last_deployed: string
  response_time_avg: number
}

interface Incident {
  id: string
  type: string
  title: string
  description: string
  location: string
  coordinates: { lat: number; lng: number }
  severity: string
  status: string
  risk_score: number
  created_at: string
  source?: string
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

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'teams' | 'dispatch'>('teams')
  const [filter, setFilter] = useState('all')
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [dispatching, setDispatching] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [teamsRes, incidentsRes, dispatchRes] = await Promise.all([
        fetch(`${API_URL}/api/teams`).catch(() => ({ json: () => ({ teams: [] }) })),
        fetch(`${API_URL}/api/incidents`).catch(() => ({ json: () => [] })),
        fetch(`${API_URL}/api/dispatch`).catch(() => ({ json: () => ({ dispatches: [] }) }))
      ])
      
      const teamsData = await teamsRes.json()
      const incidentsData = await incidentsRes.json()
      const dispatchData = await dispatchRes.json()
      
      setTeams(teamsData.teams || [])
      setIncidents(Array.isArray(incidentsData) ? incidentsData : incidentsData.incidents || [])
      setDispatches(dispatchData.dispatches || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setTeams([
        { id: 'team_001', name: 'Alpha Team', type: 'police', status: 'available', location: { lat: -1.2864, lng: 36.8232 }, base: 'Nairobi CBD', members: 4, vehicles: 1, capabilities: ['patrol', 'apprehension'], current_incident: null, last_deployed: new Date().toISOString(), response_time_avg: 8.5 },
        { id: 'team_002', name: 'Bravo Team', type: 'medical', status: 'deployed', location: { lat: -1.2644, lng: 36.8019 }, base: 'Central Hospital', members: 5, vehicles: 1, capabilities: ['first_aid', 'ambulance'], current_incident: 'inc_002', last_deployed: new Date().toISOString(), response_time_avg: 6.2 },
        { id: 'team_003', name: 'Charlie Team', type: 'traffic', status: 'available', location: { lat: -1.2815, lng: 36.8556 }, base: 'Moi Avenue', members: 4, vehicles: 2, capabilities: ['traffic_management'], current_incident: null, last_deployed: new Date().toISOString(), response_time_avg: 5.8 },
        { id: 'team_004', name: 'Delta Team', type: 'police', status: 'off_duty', location: { lat: -1.2205, lng: 36.8396 }, base: 'Kasarani', members: 6, vehicles: 2, capabilities: ['patrol', 'response'], current_incident: null, last_deployed: new Date().toISOString(), response_time_avg: 7.1 },
      ])
    }
    setLoading(false)
  }

  const handleDispatch = async () => {
    if (!selectedIncident || !selectedTeam) return
    
    setDispatching(true)
    try {
      const response = await fetch(`${API_URL}/api/teams/${selectedTeam.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: selectedIncident.id,
          priority: selectedIncident.severity === 'critical' ? 'critical' : 
                    selectedIncident.severity === 'high' ? 'high' : 'medium'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`Team ${selectedTeam.name} dispatched to ${selectedIncident.title}!\nETA: ${data.dispatch?.eta || 'Calculating...'}`)
        fetchData()
        setShowModal(false)
        setSelectedIncident(null)
        setSelectedTeam(null)
      } else {
        alert('Failed to dispatch team. Please try again.')
      }
    } catch (error) {
      console.error('Error dispatching team:', error)
      alert('Error dispatching team.')
    }
    setDispatching(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'deployed': return 'bg-yellow-500'
      case 'off_duty': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available'
      case 'deployed': return 'Deployed'
      case 'off_duty': return 'Off Duty'
      default: return status
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

  const availableTeams = teams.filter(t => t.status === 'available')
  const activeIncidents = incidents.filter(i => i.status === 'active' || i.status === 'pending')
  const filteredTeams = filter === 'all' ? teams : teams.filter(t => t.status === filter)

  return (
    <Layout title="Teams & Dispatch - Kenya Overwatch">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Teams & Dispatch</h1>
            <p className="text-gray-400">Manage teams and dispatch to incidents</p>
          </div>
          <div className="flex gap-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button 
                onClick={() => setActiveTab('teams')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'teams' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Users className="w-4 h-4 inline mr-2" /> Teams
              </button>
              <button 
                onClick={() => setActiveTab('dispatch')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'dispatch' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Send className="w-4 h-4 inline mr-2" /> Dispatch
              </button>
            </div>
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeIncidents.length}</p>
                <p className="text-gray-400 text-sm">Active Incidents</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{availableTeams.length}</p>
                <p className="text-gray-400 text-sm">Available Teams</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{teams.filter(t => t.status === 'deployed').length}</p>
                <p className="text-gray-400 text-sm">Deployed Teams</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{dispatches.filter(d => d.status === 'en_route' || d.status === 'dispatched').length}</p>
                <p className="text-gray-400 text-sm">Active Dispatches</p>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'teams' ? (
          <>
            <div className="flex gap-2">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-700'} text-white text-sm`}>All</button>
              <button onClick={() => setFilter('available')} className={`px-4 py-2 rounded-lg ${filter === 'available' ? 'bg-green-600' : 'bg-gray-700'} text-white text-sm`}>Available</button>
              <button onClick={() => setFilter('deployed')} className={`px-4 py-2 rounded-lg ${filter === 'deployed' ? 'bg-yellow-600' : 'bg-gray-700'} text-white text-sm`}>Deployed</button>
              <button onClick={() => setFilter('off_duty')} className={`px-4 py-2 rounded-lg ${filter === 'off_duty' ? 'bg-gray-600' : 'bg-gray-700'} text-white text-sm`}>Off Duty</button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTeams.map(team => (
                  <div key={team.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full ${getStatusColor(team.status)} flex items-center justify-center`}>
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{team.name}</h3>
                          <p className="text-gray-400 text-sm capitalize">{team.type} • {team.members} members • {team.vehicles} vehicles</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{team.base}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(team.status)} text-white`}>
                        {team.status === 'available' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {getStatusText(team.status)}
                      </span>
                    </div>
                    {team.current_incident && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-400">Currently responding to: <span className="text-white">{team.current_incident}</span></p>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <span className="text-xs text-gray-500">Avg Response: {team.response_time_avg} min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incidents to Dispatch */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" /> Active Incidents
              </h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : activeIncidents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active incidents</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activeIncidents.map(incident => (
                    <div 
                      key={incident.id} 
                      className={`bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors ${selectedIncident?.id === incident.id ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => { setSelectedIncident(incident); setShowModal(true) }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(incident.severity)}`}></div>
                          <div>
                            <h3 className="text-white font-medium">{incident.title}</h3>
                            <p className="text-gray-400 text-sm">{incident.description?.slice(0, 50)}...</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{incident.location}</span>
                            </div>
                          </div>
                        </div>
                        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white">
                          Dispatch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Teams */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" /> Available Teams
              </h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : availableTeams.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No available teams</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableTeams.map(team => (
                    <div key={team.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${getStatusColor(team.status)} flex items-center justify-center`}>
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{team.name}</p>
                            <p className="text-gray-400 text-xs">{team.base} • {team.members} members</p>
                          </div>
                        </div>
                        <span className="text-green-400 text-xs">{team.response_time_avg} min avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      {showModal && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Dispatch Team</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-white font-medium">{selectedIncident.title}</h3>
              <p className="text-gray-400 text-sm">{selectedIncident.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedIncident.location}</span>
                <span className={`px-2 py-0.5 rounded ${getSeverityColor(selectedIncident.severity)} text-white`}>{selectedIncident.severity}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Response Team</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableTeams.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No available teams</p>
                ) : (
                  availableTeams.map(team => (
                    <div 
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                        selectedTeam?.id === team.id 
                          ? 'border-blue-500 bg-blue-900/30' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{team.name}</p>
                          <p className="text-gray-400 text-xs">{team.base} • {team.members} members</p>
                        </div>
                        <span className="text-green-400 text-xs">{team.response_time_avg} min</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleDispatch}
                disabled={!selectedTeam || dispatching}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white flex items-center justify-center gap-2"
              >
                {dispatching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Dispatch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
