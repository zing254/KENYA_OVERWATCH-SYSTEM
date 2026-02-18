'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Layout from '@/components/Layout'
import CameraFeed from '@/components/CameraFeed'
import { Eye, Video, Grid, List, Search, Filter, RefreshCw, Settings, MapPin } from 'lucide-react'

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false })

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

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'single'>('grid')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    loadCameras()
    const interval = setInterval(loadCameras, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadCameras = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/cameras')
      const data = await res.json()
      const cameraList = data.cameras || data || []
      setCameras(cameraList)
      if (cameraList.length > 0 && !selectedCamera) {
        setSelectedCamera(cameraList[0])
      }
    } catch (error) {
      console.error('Error loading cameras:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCameras = cameras.filter(cam => {
    const matchesSearch = cam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cam.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || cam.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'offline': return 'bg-red-500'
      case 'maintenance': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Layout title="Kenya Overwatch - Camera Feeds">
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">📹 Camera Feeds</h1>
              <p className="text-blue-200 text-sm">Nairobi Metropolitan - Live Monitoring</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMap(!showMap)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${showMap ? 'bg-green-600' : 'bg-gray-700'} text-white`}
              >
                <MapPin className="w-4 h-4" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
              <button
                onClick={loadCameras}
                className="p-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-800 px-4 py-3 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cameras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`p-2 rounded ${viewMode === 'single' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              <Video className="w-5 h-5" />
            </button>
          </div>
          <div className="text-gray-400 text-sm">
            {filteredCameras.length} cameras
          </div>
        </div>

        {/* Map Section */}
        {showMap && (
          <div className="h-64 border-b border-gray-700">
            <LiveMap
              markers={cameras.map(cam => ({
                id: cam.id,
                position: [cam.coordinates.lat, cam.coordinates.lng] as [number, number],
                type: 'camera' as const,
                title: cam.name,
                status: cam.status
              }))}
              zoom={12}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'single' && selectedCamera && (
            <div className="h-full p-4">
              <CameraFeed cameraId={selectedCamera.id} cameraName={selectedCamera.name} />
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="h-full overflow-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredCameras.map(camera => (
                  <div
                    key={camera.id}
                    onClick={() => { setSelectedCamera(camera); setViewMode('single') }}
                    className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  >
                    <div className="aspect-video bg-black relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="w-12 h-12 text-gray-600" />
                      </div>
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)}`} />
                        <span className="text-white text-xs">{camera.status}</span>
                      </div>
                      {camera.ai_enabled && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                          AI
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-white font-medium text-sm truncate">{camera.name}</h3>
                      <p className="text-gray-400 text-xs truncate">{camera.location}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-500 text-xs">{camera.resolution}</span>
                        <span className="text-gray-500 text-xs">{camera.fps} fps</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="h-full overflow-auto p-4">
              <table className="w-full">
                <thead className="bg-gray-800 sticky top-0">
                  <tr>
                    <th className="text-left text-gray-400 p-3">Camera</th>
                    <th className="text-left text-gray-400 p-3">Location</th>
                    <th className="text-left text-gray-400 p-3">Status</th>
                    <th className="text-left text-gray-400 p-3">AI</th>
                    <th className="text-left text-gray-400 p-3">Resolution</th>
                    <th className="text-left text-gray-400 p-3">Risk</th>
                    <th className="text-left text-gray-400 p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCameras.map(camera => (
                    <tr key={camera.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3 text-white font-medium">{camera.name}</td>
                      <td className="p-3 text-gray-400">{camera.location}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          camera.status === 'online' ? 'bg-green-600' :
                          camera.status === 'offline' ? 'bg-red-600' : 'bg-yellow-600'
                        } text-white`}>
                          {camera.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {camera.ai_enabled ? (
                          <span className="text-green-400 text-sm">✓ {camera.ai_models.length} models</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-400">{camera.resolution}</td>
                      <td className="p-3">
                        <span className={`text-sm ${
                          camera.risk_score > 0.7 ? 'text-red-400' :
                          camera.risk_score > 0.4 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {Math.round(camera.risk_score * 100)}%
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => { setSelectedCamera(camera); setViewMode('single') }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Camera List Sidebar for single view */}
        {viewMode === 'single' && (
          <div className="absolute right-0 top-0 h-full w-64 bg-gray-800 border-l border-gray-700 overflow-auto">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-white font-semibold">All Cameras</h3>
            </div>
            {cameras.map(camera => (
              <div
                key={camera.id}
                onClick={() => setSelectedCamera(camera)}
                className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 ${
                  selectedCamera?.id === camera.id ? 'bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)}`} />
                  <span className="text-white text-sm truncate">{camera.name}</span>
                </div>
                <p className="text-gray-500 text-xs mt-1 truncate">{camera.location}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
