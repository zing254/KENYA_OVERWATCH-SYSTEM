'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Layout from '@/components/Layout'
import { 
  AlertTriangle, MapPin, Users, Clock, Phone, Radio, 
  CheckCircle, XCircle, ChevronRight, RefreshCw, 
  Siren, Cross, Car, Truck, Search, Filter,
  Navigation, Star, ArrowUpDown
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface Incident {
  id: string
  type: string
  severity: string
  status: string
  address: string
  road_name: string
  county: string
  description: string
  location: { lat: number; lng: number }
  created_at: string
  ai_confidence: number
  casualties: number
  injuries: number
}

interface Team {
  id: string
  name: string
  type: string
  status: string
  phone: string
  latitude?: number
  longitude?: number
  station?: string
  current_incident_id?: string
  members?: number
  vehicle?: string
  base_location?: string
}

interface Dispatch {
  id: string
  incident_id: string
  responder_id: string
  status: string
  dispatched_at: string
  eta_minutes?: number
}

// Mock teams with GPS coordinates for proximity calculation
const MOCK_TEAMS: Team[] = [
  { id: 'team_001', name: 'Alpha Team', type: 'police', status: 'available', phone: '+254712345001', latitude: -1.2864, longitude: 36.8232, station: 'CBD Station', members: 4, vehicle: 'Patrol Car KAA 001A', base_location: 'Nairobi CBD' },
  { id: 'team_002', name: 'Bravo Team', type: 'ambulance', status: 'available', phone: '+254712345002', latitude: -1.2921, longitude: 36.8155, station: 'KNH Station', members: 3, vehicle: 'Ambulance KBZ 123B', base_location: 'Kenyatta Hospital' },
  { id: 'team_003', name: 'Charlie Team', type: 'fire', status: 'available', phone: '+254712345003', latitude: -1.3000, longitude: 36.8300, station: 'Fire Station Central', members: 6, vehicle: 'Fire Engine KCF 456C', base_location: 'Industrial Area' },
  { id: 'team_004', name: 'Delta Team', type: 'police', status: 'available', phone: '+254712345004', latitude: -1.2500, longitude: 36.8500, station: 'Kasarani Station', members: 4, vehicle: 'Patrol Car KDD 789D', base_location: 'Kasarani' },
  { id: 'team_005', name: 'Echo Team', type: 'tow_truck', status: 'available', phone: '+254712345005', latitude: -1.3200, longitude: 36.8000, station: 'Langata Depot', members: 2, vehicle: 'Tow Truck KET 012E', base_location: 'Langata' },
  { id: 'team_006', name: 'Foxtrot Team', type: 'ambulance', status: 'busy', phone: '+254712345006', latitude: -1.2700, longitude: 36.8100, station: 'Mater Hospital', members: 3, vehicle: 'Ambulance KFZ 345F', base_location: 'South B' },
  { id: 'team_007', name: 'Golf Team', type: 'police', status: 'available', phone: '+254712345007', latitude: -1.3100, longitude: 36.7900, station: 'Karen Station', members: 4, vehicle: 'Patrol Car KGG 678G', base_location: 'Karen' },
  { id: 'team_008', name: 'Hotel Team', type: 'police', status: 'available', phone: '+254712345008', latitude: -1.2100, longitude: 36.8900, station: 'Thika Road Station', members: 5, vehicle: 'Patrol Car KHH 901H', base_location: 'Thika Road' },
]

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Calculate ETA based on distance (assuming average speed of 40 km/h in city)
function calculateETA(distanceKm: number): number {
  return Math.round((distanceKm / 40) * 60) // minutes
}

export default function DispatchPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS)
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [filter, setFilter] = useState<string>('active')
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'availability'>('distance')
  const [dispatchNotes, setDispatchNotes] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [incidentsRes, teamsRes] = await Promise.all([
        fetch(`${API_URL}/api/incidents`),
        fetch(`${API_URL}/api/teams`).catch(() => new Response(JSON.stringify({ teams: MOCK_TEAMS }))),
      ])

      const incidentsData = await incidentsRes.json()
      const teamsData = await teamsRes.json()

      setIncidents(incidentsData.incidents || incidentsData || [])
      const loadedTeams = teamsData.teams || teamsData || []
      if (loadedTeams.length > 0) {
        setTeams(loadedTeams)
      }
    } catch (error) {
      console.error('Error loading dispatch data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    
    // WebSocket for real-time updates
    let ws: WebSocket | null = null
    const connectWS = () => {
      try {
        const wsUrl = API_URL.replace('http', 'ws') + '/ws/road_safety'
        ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          ws?.send(JSON.stringify({ type: 'subscribe', channels: ['dispatch', 'responders'] }))
        }
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'responder_update') {
              setTeams(prev => prev.map(r => 
                r.id === data.responder_id ? { ...r, status: data.status } : r
              ))
            } else if (data.type === 'new_incident') {
              setIncidents(prev => [data.incident, ...prev])
            }
          } catch (e) { /* ignore parse errors */ }
        }
        
        ws.onclose = () => {
          setTimeout(connectWS, 5000)
        }
      } catch (e) { /* ignore connect errors */ }
    }
    
    connectWS()
    
    return () => {
      clearInterval(interval)
      ws?.close()
    }
  }, [loadData, API_URL])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-black'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'bg-yellow-500'
      case 'verified': return 'bg-blue-500'
      case 'assigned': return 'bg-purple-500'
      case 'enroute': return 'bg-orange-500'
      case 'onscene': return 'bg-green-500'
      case 'resolved': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getResponderTypeIcon = (type: string) => {
    switch (type) {
      case 'police': return <Car className="w-5 h-5" />
      case 'ambulance': return <Cross className="w-5 h-5" />
      case 'fire': return <Siren className="w-5 h-5" />
      case 'tow_truck': return <Truck className="w-5 h-5" />
      default: return <Car className="w-5 h-5" />
    }
  }

  const getResponderStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'busy': return 'bg-red-500'
      case 'enroute': return 'bg-orange-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  // Calculate teams with distance and ETA for selected incident
  const teamsWithProximity = useMemo(() => {
    if (!selectedIncident || !selectedIncident.location) {
      return teams.map(t => ({ ...t, distance: null, eta: null }))
    }
    
    return teams.map(team => {
      if (!team.latitude || !team.longitude) {
        return { ...team, distance: null, eta: null }
      }
      const distance = calculateDistance(
        selectedIncident.location.lat,
        selectedIncident.location.lng,
        team.latitude,
        team.longitude
      )
      const eta = calculateETA(distance)
      return { ...team, distance: Math.round(distance * 10) / 10, eta }
    }).sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      }
      if (a.status === 'available' && b.status !== 'available') return -1
      if (a.status !== 'available' && b.status === 'available') return 1
      return 0
    })
  }, [teams, selectedIncident, sortBy])

  const availableTeams = teamsWithProximity.filter(t => t.status === 'available')
  const activeIncidents = incidents.filter(i => !['resolved', 'rejected'].includes(i.status))

  const handleDispatch = async (teamId: string) => {
    if (!selectedIncident) return

    try {
      const res = await fetch(`${API_URL}/api/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: selectedIncident.id,
          responder_id: teamId,
          notes: dispatchNotes || undefined,
        })
      })
      
      if (res.ok) {
        const dispatch = await res.json()
        setDispatches(prev => [...prev, dispatch])
        setTeams(prev => prev.map(t => t.id === teamId ? { ...t, status: 'enroute' } : t))
        setDispatchNotes('')
        loadData()
      }
    } catch (error) {
      console.error('Dispatch error:', error)
    }
  }

  const handleUpdateStatus = async (incidentId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/incidents/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (res.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Status update error:', error)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Layout title="Dispatch Center - Kenya Overwatch">
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-gray-900 p-4 border-b border-red-900/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Radio className="w-6 h-6 text-red-400" />
                Dispatch Center
              </h1>
              <p className="text-red-300/70 text-sm">
                Kenya Overwatch - Emergency Response Coordination
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Active Incidents</p>
                <p className="text-2xl font-bold text-white">{activeIncidents.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Available Units</p>
                <p className="text-2xl font-bold text-green-400">{availableTeams.length}</p>
              </div>
              <button
                onClick={loadData}
                className="p-2 bg-red-800/50 rounded-lg text-white hover:bg-red-700"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Incidents Panel */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-gray-700 flex-shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === 'active' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Active ({activeIncidents.length})
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === 'all' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  All ({incidents.length})
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {(filter === 'active' ? activeIncidents : incidents).map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors ${
                    selectedIncident?.id === incident.id ? 'bg-red-900/30 border-l-2 border-l-red-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                      {incident.severity?.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">{formatTime(incident.created_at)}</span>
                  </div>
                  <p className="text-white font-medium text-sm">{(incident.type || 'incident').replace('_', ' ').toUpperCase()}</p>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                    <MapPin className="w-3 h-3" />
                    {incident.address || incident.location || 'Unknown location'}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(incident.status)}`} />
                    <span className="text-xs text-gray-300 capitalize">{incident.status}</span>
                    {incident.casualties > 0 && (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {incident.casualties} killed
                      </span>
                    )}
                    {incident.injuries > 0 && (
                      <span className="text-xs text-orange-400">
                        {incident.injuries} injured
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {(filter === 'active' ? activeIncidents : incidents).length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No active incidents</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Team Selection */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedIncident ? (
              <>
                {/* Incident Details */}
                <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded font-bold ${getSeverityColor(selectedIncident.severity)}`}>
                          {selectedIncident.severity?.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded text-sm ${getStatusColor(selectedIncident.status)} text-white`}>
                          {selectedIncident.status?.toUpperCase()}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white">
                        {(selectedIncident.type || 'incident').replace('_', ' ').toUpperCase()}
                      </h2>
                      <p className="text-gray-400 mt-1">{selectedIncident.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {selectedIncident.address || selectedIncident.location || 'Unknown'}
                        </span>
                        <span>{selectedIncident.road_name}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedIncident.status === 'detected' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedIncident.id, 'verified')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Verify
                        </button>
                      )}
                      {selectedIncident.status === 'verified' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedIncident.id, 'assigned')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Selection Controls */}
                <div className="p-3 border-b border-gray-700 bg-gray-800/30 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-red-400" />
                      Select Response Team
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Sort by:</span>
                      <button
                        onClick={() => setSortBy('distance')}
                        className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                          sortBy === 'distance' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        <Navigation className="w-3 h-3" />
                        Distance
                      </button>
                      <button
                        onClick={() => setSortBy('availability')}
                        className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                          sortBy === 'availability' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        <Star className="w-3 h-3" />
                        Available
                      </button>
                    </div>
                  </div>
                  
                  {/* Notes input */}
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Dispatch notes (optional)..."
                      value={dispatchNotes}
                      onChange={(e) => setDispatchNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Available Teams */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {teamsWithProximity.map((team) => (
                      <div
                        key={team.id}
                        className={`bg-gray-800 rounded-lg p-4 border transition-colors ${
                          team.status === 'available' 
                            ? 'border-gray-700 hover:border-red-500 cursor-pointer' 
                            : 'border-gray-700/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getResponderStatusColor(team.status)}`}>
                              {getResponderTypeIcon(team.type)}
                            </div>
                            <div>
                              <p className="text-white font-medium">{team.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{team.type?.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${getResponderStatusColor(team.status)} text-white`}>
                            {team.status}
                          </span>
                        </div>
                        
                        {/* Proximity Info */}
                        {team.distance !== null && (
                          <div className="mb-3 p-2 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400 flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                Distance
                              </span>
                              <span className="text-white font-medium">{team.distance} km</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                              <span className="text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Est. ETA
                              </span>
                              <span className={`font-medium ${team.eta && team.eta < 10 ? 'text-green-400' : team.eta && team.eta < 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {team.eta} min
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-gray-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {team.station || team.base_location}
                            </div>
                            {team.vehicle && (
                              <div className="text-xs mt-1 text-gray-500">{team.vehicle}</div>
                            )}
                          </div>
                          {team.status === 'available' && (
                            <button
                              onClick={() => handleDispatch(team.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                              Dispatch
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {availableTeams.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <XCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                      <p>No available responders</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500/50" />
                  <p className="text-lg">Select an incident to manage dispatch</p>
                  <p className="text-sm text-gray-600 mt-2">Choose an incident from the left panel to see available teams sorted by proximity</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
