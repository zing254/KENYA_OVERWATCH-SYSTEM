'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Layout from '@/components/Layout'
import CameraFeed from '@/components/CameraFeed'
import { Eye, Video, Grid, List, Search, Filter, RefreshCw, Settings, MapPin, Webcam, MonitorUp } from 'lucide-react'

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface Camera {
  id: string
  name: string
  location: string
  latitude?: number
  longitude?: number
  coordinates?: { lat: number; lng: number }
  road_name?: string
  type?: string
  status: string
  ai_enabled?: boolean
  ai_models?: string[]
  resolution?: string
  fps?: number
  risk_score?: number
  speed_limit?: number
  last_update?: string
}

// Generate mock cameras for testing
const generateMockCameras = (): Camera[] => {
  const locations = [
    { name: 'Mombasa Road Junction', lat: -1.33, lng: 36.98 },
    { name: 'Nairobi CBD Roundabout', lat: -1.2864, lng: 36.8232 },
    { name: 'Thika Road Stage', lat: -1.2107, lng: 36.8865 },
    { name: 'Uhuru Highway', lat: -1.2921, lng: 36.8155 },
    { name: 'Waiyaki Way', lat: -1.2634, lng: 36.7589 },
    { name: 'Langata Road', lat: -1.3556, lng: 36.7664 },
    { name: 'Jogoo Road', lat: -1.2914, lng: 36.8580 },
    { name: 'Ngong Road', lat: -1.3012, lng: 36.7801 },
    { name: 'Outer Ring Road', lat: -1.2537, lng: 36.8903 },
    { name: 'Kenyatta Avenue', lat: -1.2833, lng: 36.8197 },
    { name: 'Haile Selassie Ave', lat: -1.2897, lng: 36.8213 },
    { name: 'Moi Avenue', lat: -1.2841, lng: 36.8239 },
    { name: 'Tom Mboya Street', lat: -1.2847, lng: 36.8256 },
    { name: 'Mama Ngina Street', lat: -1.2878, lng: 36.8214 },
    { name: 'University Way', lat: -1.2795, lng: 36.8175 },
  ]
  
  return locations.map((loc, i) => ({
    id: `CAM-${(i + 1).toString().padStart(3, '0')}`,
    name: `Camera ${i + 1} - ${loc.name}`,
    location: loc.name,
    latitude: loc.lat,
    longitude: loc.lng,
    coordinates: { lat: loc.lat, lng: loc.lng },
    road_name: loc.name,
    status: i % 5 === 0 ? 'offline' : i % 7 === 0 ? 'maintenance' : 'online',
    ai_enabled: i % 2 === 0,
    ai_models: i % 2 === 0 ? ['vehicle_detection', 'anpr', 'speed_detection'] : [],
    resolution: ['1080p', '4K', '720p'][i % 3],
    fps: [30, 25, 15][i % 3],
    risk_score: Math.random() * 0.8 + 0.1,
    speed_limit: [50, 60, 80, 100][i % 4],
    last_update: new Date().toISOString(),
    type: ['fixed', 'ptz', 'speed', 'traffic'][i % 4],
  }))
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'single'>('grid')
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    loadCameras()
    const interval = setInterval(loadCameras, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (viewMode === 'single' && cameras.length > 0 && !selectedCamera) {
      setSelectedCamera(cameras[0])
    }
  }, [cameras, viewMode, selectedCamera])

  const loadCameras = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cameras`)
      const data = await res.json()
      let cameraList = data.cameras || data || []
      // If no cameras from API, use mock data
      if (!cameraList.length) {
        cameraList = generateMockCameras()
      }
      setCameras(cameraList)
      if (cameraList.length > 0 && !selectedCamera) {
        setSelectedCamera(cameraList[0])
      }
    } catch (error) {
      console.error('Error loading cameras:', error)
      // Use mock data on error
      const mockCameras = generateMockCameras()
      setCameras(mockCameras)
      if (mockCameras.length > 0 && !selectedCamera) {
        setSelectedCamera(mockCameras[0])
      }
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

  const gridCols = {
    small: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8',
    medium: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
    large: 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4',
  }

  const renderSkeletonCard = () => (
    <div className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-700 relative">
        <div className="absolute top-1.5 left-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
        </div>
        <div className="absolute top-1.5 right-1.5">
          <div className="w-8 h-4 bg-gray-600 rounded" />
        </div>
      </div>
      <div className="p-3">
        <div className="h-4 bg-gray-700 rounded mb-2" />
        <div className="h-3 bg-gray-700 rounded mb-2 w-3/4" />
        <div className="flex justify-between">
          <div className="h-3 bg-gray-700 rounded w-1/4" />
          <div className="h-3 bg-gray-700 rounded w-1/4" />
        </div>
      </div>
    </div>
  )

  return (
    <Layout title="Kenya Overwatch - Camera Feeds">
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-3 sm:p-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">📹 Camera Feeds</h1>
              <p className="text-blue-200 text-xs sm:text-sm">Nairobi Metropolitan - Live Monitoring</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <button
                onClick={() => setShowMap(!showMap)}
                className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 ${showMap ? 'bg-green-600' : 'bg-gray-700'} text-white text-sm`}
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">{showMap ? 'Hide Map' : 'Show Map'}</span>
              </button>
              <button
                onClick={loadCameras}
                className="p-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-800 px-3 sm:px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0">
          <div className="flex-1 relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cameras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="maintenance">Maintenance</option>
          </select>
          
          {/* Grid size selector */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            {(['small', 'medium', 'large'] as const).map(size => (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                className={`px-2 py-1 rounded text-xs ${gridSize === size ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title={`${size} grid`}
              >
                {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`p-2 rounded ${viewMode === 'single' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              <Video className="w-4 h-4" />
            </button>
          </div>
          <div className="text-gray-400 text-xs sm:text-sm px-2">
            {filteredCameras.length} cameras
          </div>
        </div>

        {/* Map Section */}
        {showMap && (
          <div className="h-48 sm:h-64 border-b border-gray-700 flex-shrink-0">
            <LiveMap
              markers={cameras.filter(cam => cam.coordinates && cam.coordinates.lat != null && cam.coordinates.lng != null).map(cam => ({
                id: cam.id,
                position: [cam.coordinates!.lat, cam.coordinates!.lng] as [number, number],
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
            <div className="h-full flex flex-col lg:flex-row">
              <div className="flex-1 p-2 sm:p-4 min-h-0">
                <CameraFeed 
                  cameraId={selectedCamera.id} 
                  cameraName={selectedCamera.name} 
                  cameraType={selectedCamera.type as any || 'fixed'}
                />
              </div>
              {/* Camera sidebar */}
              <div className="w-full lg:w-72 bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-700 overflow-auto flex-shrink-0 max-h-48 lg:max-h-full">
                <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm">All Cameras</h3>
                  <button
                    onClick={() => setViewMode('grid')}
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    Close
                  </button>
                </div>
                <div className="p-2">
                  {cameras.map(camera => (
                    <div
                      key={camera.id}
                      onClick={() => setSelectedCamera(camera)}
                      className={`p-2 border-b border-gray-700 cursor-pointer hover:bg-gray-700 rounded-lg mb-1 ${
                        selectedCamera?.id === camera.id ? 'bg-gray-700 border-gray-600' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(camera.status)}`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-white text-xs font-medium truncate block">{camera.name}</span>
                          <p className="text-gray-500 text-[10px] truncate">{camera.location}</p>
                        </div>
                        {camera.ai_enabled && (
                          <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded flex-shrink-0">AI</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="h-full overflow-auto p-2 sm:p-4">
              <div className={`grid ${gridCols[gridSize]} gap-2 sm:gap-3 auto-rows-min`}>
                {loading ? (
                  Array.from({ length: 12 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      {renderSkeletonCard()}
                    </div>
                  ))
                ) : (
                  filteredCameras.map(camera => (
                    <div
                      key={camera.id}
                      onClick={() => { setSelectedCamera(camera); setViewMode('single') }}
                      className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-green-500 transition-all group relative"
                    >
                      <div className="aspect-video bg-black relative">
                        <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                          {camera.status === 'online' ? (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                              <div className="text-center">
                                <Video className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 mx-auto mb-1" />
                                <span className="text-[8px] text-gray-500">LIVE</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 mx-auto" />
                            </div>
                          )}
                        </div>
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)}`} />
                          <span className="text-white text-[8px] sm:text-[10px] font-medium">{camera.status}</span>
                        </div>
                        {camera.ai_enabled && (
                          <div className="absolute top-1.5 right-1.5 bg-green-600 text-white text-[8px] px-1 py-0.5 rounded font-medium">
                            AI
                          </div>
                        )}
                        <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-4 h-4 text-white/80" />
                        </div>
                      </div>
                      <div className="p-2">
                        <h3 className="text-white font-medium text-xs truncate">{camera.name}</h3>
                        <p className="text-gray-400 text-[10px] truncate">{camera.location}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-500 text-[9px]">{camera.resolution}</span>
                          <span className="text-gray-500 text-[9px]">{camera.fps}fps</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="h-full overflow-auto p-2 sm:p-4">
              <div className="space-y-2">
                {filteredCameras.map(camera => (
                  <div 
                    key={camera.id} 
                    onClick={() => { setSelectedCamera(camera); setViewMode('single') }}
                    className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(camera.status)}`} />
                        <div>
                          <span className="text-white font-medium text-sm">{camera.name}</span>
                          <p className="text-gray-400 text-xs">{camera.location} • {camera.resolution} • {camera.fps}fps</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {camera.ai_enabled && (
                          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">AI</span>
                        )}
                        <span className={`text-xs font-medium ${
                          (camera.risk_score ?? 0) > 0.7 ? 'text-red-400' :
                          (camera.risk_score ?? 0) > 0.4 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          Risk: {Math.round((camera.risk_score ?? 0) * 100)}%
                        </span>
                        <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
