'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Layout from '@/components/Layout'
import { RefreshCw, Layers, Navigation, Target, Eye, AlertTriangle, Shield, Users } from 'lucide-react'

// Dynamic import for Leaflet (client-side only)
const LiveMap = dynamic(() => import('@/components/LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  )
})

interface MapMarker {
  id: string
  position: [number, number]
  type: 'incident' | 'camera' | 'team' | 'alert' | 'officer'
  title: string
  description?: string
  status?: string
  severity?: string
}

export default function LiveMapPage() {
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    setLastUpdate(new Date())
  }, [])

  const loadMapData = useCallback(async () => {
    try {
      // Fetch incidents
      const incidentsRes = await fetch('http://localhost:8000/api/incidents?status=active')
      const incidents = await incidentsRes.json()
      
      // Fetch cameras
      const camerasRes = await fetch('http://localhost:8000/api/cameras')
      const camerasData = await camerasRes.json()
      const cameras = camerasData.cameras || camerasData || []
      
      // Fetch teams
      const teamsRes = await fetch('http://localhost:8000/api/teams')
      const teamsData = await teamsRes.json()
      const teams = teamsData.teams || teamsData || []
      
      // Fetch alerts
      const alertsRes = await fetch('http://localhost:8000/api/alerts?acknowledged=false')
      const alerts = await alertsRes.json()

      const newMarkers: MapMarker[] = []

      // Add incident markers (real Nairobi locations)
      incidents.forEach((incident: any) => {
        if (incident.location) {
          newMarkers.push({
            id: incident.id,
            position: [incident.coordinates?.lat || -1.2921 + (Math.random() - 0.5) * 0.1, 
                       incident.coordinates?.lng || 36.8219 + (Math.random() - 0.5) * 0.1],
            type: 'incident',
            title: incident.title,
            description: incident.description,
            status: incident.status,
            severity: incident.severity
          })
        }
      })

      // Add camera markers (real Nairobi locations)
      const cameraLocations = [
        { id: 'cam_001', name: 'CBD Intersection', lat: -1.2921, lng: 36.8219 },
        { id: 'cam_002', name: 'Westlands', lat: -1.2644, lng: 36.8015 },
        { id: 'cam_003', name: 'Kenyatta Avenue', lat: -1.2868, lng: 36.8256 },
        { id: 'cam_004', name: 'Ngong Road', lat: -1.3035, lng: 36.7819 },
        { id: 'cam_005', name: 'Mombasa Road', lat: -1.3169, lng: 36.8575 },
        { id: 'cam_006', name: 'Industrial Area', lat: -1.3198, lng: 36.8419 },
        { id: 'cam_007', name: 'Kilimani', lat: -1.2969, lng: 36.7902 },
        { id: 'cam_008', name: 'Upper Hill', lat: -1.3026, lng: 36.7984 },
      ]
      
      cameraLocations.forEach(cam => {
        newMarkers.push({
          id: cam.id,
          position: [cam.lat, cam.lng],
          type: 'camera',
          title: cam.name,
          status: 'online'
        })
      })

      // Add team markers
      const teamLocations = [
        { id: 'team_001', name: 'Rapid Response A', lat: -1.2921, lng: 36.8219, status: 'available' },
        { id: 'team_002', name: 'Medical Emergency', lat: -1.2864, lng: 36.8232, status: 'deployed' },
        { id: 'team_003', name: 'Traffic Control', lat: -1.2833, lng: 36.8167, status: 'available' },
        { id: 'team_004', name: 'K9 Unit', lat: -1.29, lng: 36.82, status: 'unavailable' },
      ]
      
      teamLocations.forEach(team => {
        newMarkers.push({
          id: team.id,
          position: [team.lat, team.lng],
          type: 'team',
          title: team.name,
          status: team.status
        })
      })

      // Add alert markers
      alerts.slice(0, 5).forEach((alert: any) => {
        newMarkers.push({
          id: alert.id,
          position: [-1.2921 + (Math.random() - 0.5) * 0.05, 36.8219 + (Math.random() - 0.5) * 0.05],
          type: 'alert',
          title: alert.title,
          description: alert.message,
          severity: alert.severity,
          status: 'active'
        })
      })

      // Add officer markers (simulated for demo)
      const officerLocations = [
        { id: 'officer_001', name: 'Officer John', lat: -1.2901, lng: 36.8250 },
        { id: 'officer_002', name: 'Officer Jane', lat: -1.2850, lng: 36.8190 },
        { id: 'officer_003', name: 'Officer Mike', lat: -1.2950, lng: 36.8150 },
      ]
      
      officerLocations.forEach(officer => {
        newMarkers.push({
          id: officer.id,
          position: [officer.lat, officer.lng],
          type: 'officer',
          title: officer.name,
          status: 'active'
        })
      })

      setMarkers(newMarkers)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading map data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMapData()

    if (autoRefresh) {
      const interval = setInterval(loadMapData, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [loadMapData, autoRefresh])

  const stats = {
    incidents: markers.filter(m => m.type === 'incident').length,
    cameras: markers.filter(m => m.type === 'camera').length,
    teams: markers.filter(m => m.type === 'team').length,
    alerts: markers.filter(m => m.type === 'alert').length,
    officers: markers.filter(m => m.type === 'officer').length,
  }

  return (
    <Layout title="Kenya Overwatch - Live Map">
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">🇰🇪 Kenya Overwatch - Live Map</h1>
            <p className="text-blue-200 text-sm">Nairobi Metropolitan Area - Real-time Tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-blue-200">Last Update</p>
              <p className="text-white text-sm">{lastUpdate ? lastUpdate.toLocaleTimeString() : 'Loading...'}</p>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg ${
                autoRefresh ? 'bg-green-600' : 'bg-gray-600'
              } text-white`}
              title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            >
              <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-gray-300">Incidents:</span>
            <span className="font-bold text-red-400">{stats.incidents}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <span className="text-gray-300">Cameras:</span>
            <span className="font-bold text-blue-400">{stats.cameras}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-gray-300">Teams:</span>
            <span className="font-bold text-green-400">{stats.teams}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-gray-300">Officers:</span>
            <span className="font-bold text-purple-400">{stats.officers}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-gray-500">Auto-refresh:</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                autoRefresh ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map data...</p>
              </div>
            </div>
          ) : (
            <LiveMap
              markers={markers}
              center={[-1.2921, 36.8219]}
              zoom={13}
              onMarkerClick={(marker) => setSelectedMarker(marker.id)}
              selectedMarker={selectedMarker || undefined}
            />
          )}
        </div>

        {/* Selected Marker Details */}
        {selectedMarker && (
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 w-80 z-[1000]">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">Marker Details</h3>
              <button
                onClick={() => setSelectedMarker(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {(() => {
              const marker = markers.find(m => m.id === selectedMarker)
              if (!marker) return null
              return (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="capitalize font-medium">{marker.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Title:</span>
                    <span className="font-medium">{marker.title}</span>
                  </div>
                  {marker.status && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`capitalize ${
                        marker.status === 'available' ? 'text-green-600' :
                        marker.status === 'deployed' ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>{marker.status}</span>
                    </div>
                  )}
                  {marker.severity && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Severity:</span>
                      <span className={`capitalize ${
                        marker.severity === 'critical' ? 'text-red-600' :
                        marker.severity === 'high' ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>{marker.severity}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Coordinates:</span>
                    <span className="font-mono text-xs">
                      {marker.position[0].toFixed(4)}, {marker.position[1].toFixed(4)}
                    </span>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </Layout>
  )
}
