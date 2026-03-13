'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Video, Play, Pause, Maximize2, Settings, AlertTriangle, 
  Car, User, Activity, Zap, Eye, Camera, Volume2, VolumeX,
  RefreshCw, Download, Filter, Clock, MapPin
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface StreamConfig {
  cameraId: string
  quality: '240p' | '480p' | '720p' | '1080p'
  aiEnabled: boolean
  detectionTypes: string[]
}

interface Detection {
  id: string
  type: 'vehicle' | 'person' | 'speed' | 'license_plate'
  confidence: number
  bbox: { x: number; y: number; width: number; height: number }
  timestamp: string
  details?: any
}

interface CameraFeedProps {
  cameraId?: string
  cameraName?: string
  onIncidentDetected?: (detection: Detection) => void
  autoPlay?: boolean
}

export default function AICameraFeed({ 
  cameraId = 'CAM001', 
  cameraName = 'Camera Feed',
  onIncidentDetected,
  autoPlay = true 
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentQuality, setCurrentQuality] = useState<'240p' | '480p' | '720p' | '1080p'>('720p')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [detections, setDetections] = useState<Detection[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [stats, setStats] = useState({
    vehicles: 0,
    persons: 0,
    violations: 0,
    avgSpeed: 0
  })
  const [detectionTypes, setDetectionTypes] = useState({
    vehicles: true,
    persons: true,
    speed: true,
    licensePlates: true
  })
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const simulateDetection = useCallback(() => {
    if (!aiEnabled) return

    const newDetections: Detection[] = []
    
    if (detectionTypes.vehicles && Math.random() > 0.7) {
      newDetections.push({
        id: `det_${Date.now()}_v`,
        type: 'vehicle',
        confidence: Math.random() * 0.3 + 0.7,
        bbox: {
          x: Math.random() * 60 + 10,
          y: Math.random() * 40 + 20,
          width: Math.random() * 20 + 10,
          height: Math.random() * 15 + 8
        },
        timestamp: new Date().toISOString(),
        details: { type: ['car', 'truck', 'motorcycle'][Math.floor(Math.random() * 3)] }
      })
    }

    if (detectionTypes.persons && Math.random() > 0.8) {
      newDetections.push({
        id: `det_${Date.now()}_p`,
        type: 'person',
        confidence: Math.random() * 0.25 + 0.75,
        bbox: {
          x: Math.random() * 50 + 20,
          y: Math.random() * 30 + 30,
          width: Math.random() * 10 + 5,
          height: Math.random() * 20 + 10
        },
        timestamp: new Date().toISOString()
      })
    }

    if (detectionTypes.speed && Math.random() > 0.9) {
      const speed = Math.random() * 80 + 40
      newDetections.push({
        id: `det_${Date.now()}_s`,
        type: 'speed',
        confidence: Math.random() * 0.2 + 0.8,
        bbox: { x: 0, y: 0, width: 0, height: 0 },
        timestamp: new Date().toISOString(),
        details: { speed: Math.round(speed), limit: 60, exceeded: speed > 60 }
      })
    }

    if (newDetections.length > 0) {
      setDetections(prev => [...newDetections, ...prev].slice(0, 20))
      setLastUpdate(new Date())

      setStats(prev => ({
        vehicles: prev.vehicles + newDetections.filter(d => d.type === 'vehicle').length,
        persons: prev.persons + newDetections.filter(d => d.type === 'person').length,
        violations: prev.violations + newDetections.filter(d => d.type === 'speed' && d.details?.exceeded).length,
        avgSpeed: Math.round((prev.avgSpeed + (newDetections.find(d => d.type === 'speed')?.details?.speed || 0)) / 2)
      }))

      if (onIncidentDetected && newDetections.some(d => d.type === 'speed' || d.type === 'vehicle')) {
        onIncidentDetected(newDetections[0])
      }
    }
  }, [aiEnabled, detectionTypes, onIncidentDetected])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        simulateDetection()
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, simulateDetection])

  const togglePlay = () => setIsPlaying(!isPlaying)
  const toggleMute = () => setIsMuted(!isMuted)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const getDetectionColor = (type: string) => {
    switch (type) {
      case 'vehicle': return 'border-blue-500 bg-blue-500/20'
      case 'person': return 'border-green-500 bg-green-500/20'
      case 'speed': return 'border-red-500 bg-red-500/20'
      case 'license_plate': return 'border-yellow-500 bg-yellow-500/20'
      default: return 'border-white bg-white/20'
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-ntsa-primaryDark to-ntsa-primary px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-ntsa-primaryLight" />
          <div>
            <h3 className="text-white font-medium text-sm">{cameraName}</h3>
            <p className="text-ntsa-primaryLight text-xs">Live Feed • {currentQuality}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">{isPlaying ? 'LIVE' : 'PAUSED'}</span>
        </div>
      </div>

      {/* Video Area */}
      <div className="relative aspect-video bg-black">
        {/* Simulated Video Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center text-gray-600">
            <Video className="w-16 h-16 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Camera Feed Simulation</p>
            <p className="text-xs mt-1">AI Detection Active</p>
          </div>
        </div>

        {/* Detection Overlays */}
        {aiEnabled && detections.map((detection) => (
          <div
            key={detection.id}
            className={`absolute border-2 rounded ${getDetectionColor(detection.type)}`}
            style={{
              left: `${detection.bbox.x}%`,
              top: `${detection.bbox.y}%`,
              width: `${detection.bbox.width}%`,
              height: `${detection.bbox.height}%`
            }}
          >
            <div className="absolute -top-6 left-0 text-xs bg-black/70 text-white px-1 rounded">
              {detection.type === 'vehicle' && <Car className="w-3 h-3 inline mr-1" />}
              {detection.type === 'person' && <User className="w-3 h-3 inline mr-1" />}
              {detection.type === 'speed' && <Zap className="w-3 h-3 inline mr-1" />}
              {Math.round(detection.confidence * 100)}%
            </div>
          </div>
        ))}

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={togglePlay} className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
                {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
              </button>
              <button onClick={toggleMute} className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
                {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setAiEnabled(!aiEnabled)} 
                className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${aiEnabled ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-gray-700 text-gray-400'}`}
              >
                <Eye className="w-3 h-3" />
                AI {aiEnabled ? 'ON' : 'OFF'}
              </button>
              <button onClick={toggleFullscreen} className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
              <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
                <Settings className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overlay */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur rounded-lg p-2 text-xs space-y-1">
          <div className="flex items-center gap-2 text-gray-300">
            <Car className="w-3 h-3 text-blue-400" />
            <span>Vehicles: {stats.vehicles}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <User className="w-3 h-3 text-green-400" />
            <span>Users: {stats.persons}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>Violations: {stats.violations}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Activity className="w-3 h-3 text-yellow-400" />
            <span>Avg Speed: {stats.avgSpeed} km/h</span>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <h4 className="text-white font-medium mb-3">Detection Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Quality</label>
              <select 
                value={currentQuality}
                onChange={(e) => setCurrentQuality(e.target.value as any)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="240p">240p</option>
                <option value="480p">480p</option>
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Detection Types</label>
              <div className="space-y-1">
                {Object.entries(detectionTypes).map(([key, enabled]) => (
                  <label key={key} className="flex items-center gap-2 text-xs text-gray-300">
                    <input 
                      type="checkbox" 
                      checked={enabled}
                      onChange={(e) => setDetectionTypes(prev => ({...prev, [key]: e.target.checked}))}
                      className="rounded"
                    />
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Detections */}
      <div className="p-3 bg-gray-800/50 border-t border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Recent Detections</span>
          <span className="text-xs text-gray-500">{lastUpdate.toLocaleTimeString()}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {detections.slice(0, 5).map((detection) => (
            <div key={detection.id} className={`px-2 py-1 rounded text-xs ${getDetectionColor(detection.type)}`}>
              {detection.type} - {Math.round(detection.confidence * 100)}%
            </div>
          ))}
          {detections.length === 0 && (
            <span className="text-xs text-gray-500">No detections yet</span>
          )}
        </div>
      </div>
    </div>
  )
}
