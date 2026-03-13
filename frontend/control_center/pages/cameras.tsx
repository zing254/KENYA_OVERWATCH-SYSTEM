'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Layout from '@/components/Layout'
import CameraFeed from '@/components/CameraFeed'
import { Eye, Video, Grid, List, Search, Filter, RefreshCw, Settings, MapPin } from 'lucide-react'

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

  // Auto-select camera when in single view
  useEffect(() => {
    if (viewMode === 'single' && cameras.length > 0 && !selectedCamera) {
      setSelectedCamera(cameras[0])
    }
  }, [cameras, viewMode, selectedCamera])

  const loadCameras = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cameras`)
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
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-3 sm:p-4">
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
                <span className="sm:hidden">{showMap ? 'Hide' : 'Map'}</span>
              </button>
              <button
                onClick={loadCameras}
                className="p-2 sm:p-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600"
              >
                <RefreshCw className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-800 px-3 sm:px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
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
            className="px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              <Grid className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              <List className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`p-2 rounded ${viewMode === 'single' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              <Video className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
          <div className="text-gray-400 text-xs sm:text-sm px-2">
            {filteredCameras.length} cameras
          </div>
        </div>

        {/* Map Section */}
        {showMap && (
          <div className="h-64 border-b border-gray-700">
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
            <div className="h-full flex flex-col">
              {/* Mobile back button */}
              <div className="md:hidden p-3 border-b border-gray-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to Grid</span>
                </button>
              </div>
              <div className="flex-1 p-2 sm:p-4">
                <CameraFeed cameraId={selectedCamera.id} cameraName={selectedCamera.name} />
              </div>
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="h-full overflow-auto p-2 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3">
                {loading ? (
                  // Loading skeleton cards
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
                      className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-green-500 transition-all group relative min-h-[140px]"
                    >
                      <div className="aspect-video bg-black relative">
                        <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Video className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                        </div>
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(camera.status)}`} />
                          <span className="text-white text-[8px] sm:text-[10px] font-medium">{camera.status}</span>
                        </div>
                        {camera.ai_enabled && (
                          <div className="absolute top-1.5 right-1.5 bg-green-600 text-white text-[8px] sm:text-[9px] px-1 py-0.5 rounded font-medium">
                            AI
                          </div>
                        )}
                        <div className="absolute bottom-1.5 right-1.5">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-white/0 group-hover:text-white/80 transition-colors" />
                        </div>
                      </div>
                      <div className="p-2 sm:p-3">
                        <h3 className="text-white font-medium text-xs sm:text-sm truncate">{camera.name}</h3>
                        <p className="text-gray-400 text-[9px] sm:text-xs truncate">{camera.location}</p>
                        <div className="flex items-center justify-between mt-1 sm:mt-2">
                          <span className="text-gray-500 text-[8px] sm:text-[9px]">{camera.resolution}</span>
                          <span className="text-gray-500 text-[8px] sm:text-[9px]">{camera.fps} fps</span>
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
              <div className="space-y-2 sm:space-y-0">
                <div className="hidden sm:block bg-gray-800 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 p-3 border-b border-gray-700">
                    <div className="col-span-2 sm:col-span-1 text-left text-gray-400 text-sm font-medium">Camera</div>
                    <div className="col-span-3 sm:col-span-2 text-left text-gray-400 text-sm font-medium">Location</div>
                    <div className="col-span-2 sm:col-span-1 text-left text-gray-400 text-sm font-medium">Status</div>
                    <div className="col-span-1 sm:col-span-1 text-left text-gray-400 text-sm font-medium">AI</div>
                    <div className="col-span-2 sm:col-span-1 text-left text-gray-400 text-sm font-medium">Resolution</div>
                    <div className="col-span-2 sm:col-span-1 text-left text-gray-400 text-sm font-medium">Risk</div>
                    <div className="col-span-1 sm:col-span-1 text-left text-gray-400 text-sm font-medium">Actions</div>
                  </div>
                </div>
                {filteredCameras.map(camera => (
                  <div key={camera.id} className="bg-gray-800 rounded-lg p-3 sm:p-3 border border-gray-700 hover:border-gray-600 transition-colors">
                    {/* Mobile view */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)}`} />
                          <span className="text-white font-medium text-sm">{camera.name}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          camera.status === 'online' ? 'bg-green-600' :
                          camera.status === 'offline' ? 'bg-red-600' : 'bg-yellow-600'
                        } text-white`}>
                          {camera.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs">{camera.location}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">
                          {camera.ai_enabled ? `AI: ${camera.ai_models?.length ?? 0} models` : 'No AI'}
                        </span>
                        <span className="text-gray-500 text-xs">{camera.resolution}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${
                          (camera.risk_score ?? 0) > 0.7 ? 'text-red-400' :
                          (camera.risk_score ?? 0) > 0.4 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          Risk: {Math.round((camera.risk_score ?? 0) * 100)}%
                        </span>
                        <button
                          onClick={() => { setSelectedCamera(camera); setViewMode('single') }}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 whitespace-nowrap"
                        >
                          View
                        </button>
                      </div>
                    </div>
                    
                    {/* Desktop view */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-2 text-white font-medium text-sm">{camera.name}</div>
                      <div className="col-span-3 text-gray-400 text-sm truncate">{camera.location}</div>
                      <div className="col-span-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          camera.status === 'online' ? 'bg-green-600' :
                          camera.status === 'offline' ? 'bg-red-600' : 'bg-yellow-600'
                        } text-white`}>
                          {camera.status}
                        </span>
                      </div>
                      <div className="col-span-1 text-gray-400 text-sm">
                        {camera.ai_enabled ? (
                          <span className="text-green-400 text-sm">✓ {camera.ai_models?.length ?? 0} models</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                      <div className="col-span-2 text-gray-400 text-sm">{camera.resolution}</div>
                      <div className="col-span-2">
                        <span className={`text-sm ${
                          (camera.risk_score ?? 0) > 0.7 ? 'text-red-400' :
                          (camera.risk_score ?? 0) > 0.4 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {Math.round((camera.risk_score ?? 0) * 100)}%
                        </span>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => { setSelectedCamera(camera); setViewMode('single') }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
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

        {/* Camera List Sidebar for single view */}
        {viewMode === 'single' && (
          <>
            {/* Mobile overlay */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 sm:hidden"
              onClick={() => setViewMode('grid')}
            />
            {/* Sidebar */}
            <div className="absolute right-0 top-0 h-full sm:relative sm:h-auto sm:flex-1 sm:ml-4 bg-gray-800 border-l border-gray-700 overflow-auto z-50">
              <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-semibold">All Cameras</h3>
                <button
                  onClick={() => setViewMode('grid')}
                  className="sm:hidden text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-2 sm:p-4">
                {cameras.map(camera => (
                  <div
                    key={camera.id}
                    onClick={() => setSelectedCamera(camera)}
                    className={`p-3 sm:p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 rounded-lg mb-2 ${
                      selectedCamera?.id === camera.id ? 'bg-gray-700 border-gray-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(camera.status)}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm font-medium truncate">{camera.name}</span>
                        <p className="text-gray-500 text-xs mt-1 truncate">{camera.location}</p>
                      </div>
                      {camera.ai_enabled && (
                        <div className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                          AI
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
