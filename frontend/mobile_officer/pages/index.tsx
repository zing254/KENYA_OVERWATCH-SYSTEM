'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  CheckCircle, 
  Clock, 
  Shield,
  Navigation,
  Eye,
  ChevronRight,
  RefreshCw,
  Users,
  Activity
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
}

interface Team {
  id: string
  name: string
  status: string
  base: string
  members: number
}

export default function ResponderApp() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [activeTab, setActiveTab] = useState<'incidents' | 'my-team' | 'map'>('incidents')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [incidentsRes, teamsRes] = await Promise.all([
        fetch(`${API_URL}/api/incidents`).catch(() => ({ json: () => [] })),
        fetch(`${API_URL}/api/teams`).catch(() => ({ json: () => ({ teams: [] }) }))
      ])
      
      const incidentsData = await incidentsRes.json()
      const teamsData = await teamsRes.json()
      
      setIncidents(Array.isArray(incidentsData) ? incidentsData : incidentsData?.incidents || [])
      setTeams(teamsData?.teams || [])
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  const myTeam = teams[0]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Kenya Overwatch - Responder</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            <span className="font-bold">Responder App</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-gray-400">Online</span>
          </div>
        </div>
        
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'incidents' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Incidents
            {incidents.filter(i => i.status === 'active').length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {incidents.filter(i => i.status === 'active').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('my-team')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'my-team' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
            }`}
          >
            <Users className="w-4 h-4" />
            My Team
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'map' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Map
          </button>
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : activeTab === 'incidents' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Active Incidents</h2>
              <button onClick={fetchData} className="text-sm text-blue-400 flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
            
            {incidents.filter(i => i.status === 'active').length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No active incidents</p>
              </div>
            ) : (
              incidents.filter(i => i.status === 'active').map(incident => (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`bg-gray-800 rounded-lg p-4 border-l-4 cursor-pointer hover:bg-gray-750 ${
                    selectedIncident?.id === incident.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{ borderLeftColor: incident.severity === 'critical' ? '#dc2626' : incident.severity === 'high' ? '#ea580c' : '#ca8a04' }}
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
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'my-team' ? (
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
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                      <Navigation className="w-4 h-4" />
                      Navigate to Incident
                    </button>
                    <button className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact Dispatch
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium mb-3">Update Status</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['available', 'en_route', 'on_scene'].map(status => (
                      <button
                        key={status}
                        disabled={updatingStatus}
                        onClick={() => {}}
                        className={`py-2 rounded-lg text-sm font-medium ${
                          status === 'available' ? 'bg-green-600 hover:bg-green-700' :
                          status === 'en_route' ? 'bg-blue-600 hover:bg-blue-700' :
                          'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        {status.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
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
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin className="w-16 h-16 mx-auto mb-2" />
                <p>Map View</p>
                <p className="text-sm">Incidents: {incidents.filter(i => i.status === 'active').length}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-gray-800 w-full rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(selectedIncident.severity)}`}>
                  {selectedIncident.severity.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400">{selectedIncident.type}</span>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="text-gray-400">✕</button>
            </div>
            
            <h2 className="text-xl font-bold mb-2">{selectedIncident.title}</h2>
            <p className="text-gray-300 mb-4">{selectedIncident.description}</p>
            
            <div className="bg-gray-700 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{selectedIncident.location}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => { updateIncidentStatus(selectedIncident.id, 'responding'); setSelectedIncident(null) }}
                disabled={updatingStatus}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Accept & Respond
              </button>
              <button 
                onClick={() => { updateIncidentStatus(selectedIncident.id, 'resolved'); setSelectedIncident(null) }}
                disabled={updatingStatus}
                className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Resolved
              </button>
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
