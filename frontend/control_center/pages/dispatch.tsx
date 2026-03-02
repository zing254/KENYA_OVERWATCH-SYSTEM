'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import { 
  AlertTriangle, MapPin, Users, Clock, Phone, Radio, 
  CheckCircle, XCircle, ChevronRight, RefreshCw, 
  Siren, Cross, Car, Truck, Search, Filter
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

interface Responder {
  id: string
  name: string
  type: string
  status: string
  phone: string
  latitude: number
  longitude: number
  station: string
  current_incident_id?: string
}

interface Dispatch {
  id: string
  incident_id: string
  responder_id: string
  status: string
  dispatched_at: string
  eta_minutes?: number
}

export default function DispatchPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [responders, setResponders] = useState<Responder[]>([])
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [filter, setFilter] = useState<string>('active')

  const loadData = useCallback(async () => {
    try {
      const [incidentsRes, respondersRes, dispatchesRes] = await Promise.all([
        fetch(`${API_URL}/api/incidents`),
        fetch(`${API_URL}/api/responders`),
        fetch(`${API_URL}/api/dispatch/incident/${selectedIncident?.id || ''}`).catch(() => new Response('[]'))
      ])

      const incidentsData = await incidentsRes.json()
      const respondersData = await respondersRes.json()
      const dispatchesData = await dispatchesRes.json()

      setIncidents(incidentsData.incidents || [])
      setResponders(respondersData.responders || [])
      setDispatches(dispatchesData.dispatches || [])
    } catch (error) {
      console.error('Error loading dispatch data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedIncident?.id])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [loadData])

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

  const availableResponders = responders.filter(r => r.status === 'available')
  
  const activeIncidents = incidents.filter(i => 
    !['resolved', 'rejected'].includes(i.status)
  )

  const handleDispatch = async (responderId: string) => {
    if (!selectedIncident) return

    try {
      const res = await fetch(`${API_URL}/api/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: selectedIncident.id,
          responder_id: responderId
        })
      })
      
      if (res.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Dispatch error:', error)
    }
  }

  const handleUpdateStatus = async (incidentId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/incidents/${incidentId}/status`, {
        method: 'PATCH',
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
        <div className="bg-gradient-to-r from-ntsa-primaryDark to-gray-900 p-4 border-b border-ntsa-primaryLight/30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Radio className="w-6 h-6 text-ntsa-primaryLight" />
                Dispatch Center
              </h1>
              <p className="text-ntsa-primaryLight/70 text-sm">
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
                <p className="text-2xl font-bold text-green-400">{availableResponders.length}</p>
              </div>
              <button
                onClick={loadData}
                className="p-2 bg-ntsa-primary/50 rounded-lg text-white hover:bg-ntsa-primary"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Incidents Panel */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === 'active' ? 'bg-ntsa-primaryLight text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Active ({activeIncidents.length})
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === 'all' ? 'bg-ntsa-primaryLight text-white' : 'bg-gray-700 text-gray-300'
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
                  className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-800 ${
                    selectedIncident?.id === incident.id ? 'bg-ntsa-primaryDark' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                      {incident.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">{formatTime(incident.created_at)}</span>
                  </div>
                  <p className="text-white font-medium text-sm">{incident.type.replace('_', ' ').toUpperCase()}</p>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                    <MapPin className="w-3 h-3" />
                    {incident.address}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(incident.status)}`} />
                    <span className="text-xs text-gray-300 capitalize">{incident.status}</span>
                    {incident.causalties > 0 && (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {incident.causalties} killed
                      </span>
                    )}
                    {incident.injuries > 0 && (
                      <span className="text-xs text-orange-400 flex items-center gap-1">
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

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {selectedIncident ? (
              <>
                {/* Incident Details */}
                <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded font-bold ${getSeverityColor(selectedIncident.severity)}`}>
                          {selectedIncident.severity.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded text-sm ${getStatusColor(selectedIncident.status)} text-white`}>
                          {selectedIncident.status.toUpperCase()}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white">
                        {selectedIncident.type.replace('_', ' ').toUpperCase()}
                      </h2>
                      <p className="text-gray-400 mt-1">{selectedIncident.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {selectedIncident.address}
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

                {/* Available Responders */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-ntsa-primaryLight" />
                    Available Responders
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {availableResponders.map((responder) => (
                      <div
                        key={responder.id}
                        className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-ntsa-primaryLight"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${getResponderStatusColor(responder.status)}`}>
                              {getResponderTypeIcon(responder.type)}
                            </div>
                            <div>
                              <p className="text-white font-medium">{responder.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{responder.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${getResponderStatusColor(responder.status)} text-white`}>
                            {responder.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {responder.station}
                          </span>
                          <button
                            onClick={() => handleDispatch(responder.id)}
                            className="px-3 py-1 bg-ntsa-primary text-white rounded hover:bg-ntsa-primaryLight"
                          >
                            Dispatch
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {availableResponders.length === 0 && (
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
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-ntsa-primaryLight/50" />
                  <p className="text-lg">Select an incident to manage dispatch</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
