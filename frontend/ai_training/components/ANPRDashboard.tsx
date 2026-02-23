'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Shield, 
  Activity, 
  Target, 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  MapPin,
  Car,
  Eye,
  Zap,
  BarChart3,
  Cpu,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react'

interface ANPRStats {
  vehicles_today: number
  active_tracks: number
  avg_confidence: number
  fps: number
  latency_ms: number
  total_plates: number
  total_detections: number
}

interface PlateTrack {
  track_id: number
  plate: string
  confidence: number
  verified: boolean
  camera_id: string
  last_seen: string
  bbox: number[]
}

interface ANPRLogEntry {
  id: string
  plate: string
  timestamp: string
  camera: string
  confidence: number
  verified: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ANPRDashboard() {
  const [stats, setStats] = useState<ANPRStats | null>(null)
  const [tracks, setTracks] = useState<PlateTrack[]>([])
  const [plates, setPlates] = useState<ANPRLogEntry[]>([])
  const [selectedCamera, setSelectedCamera] = useState('cam_001')
  const [isPlaying, setIsPlaying] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [liveFrame, setLiveFrame] = useState<string | null>(null)
  const [logs, setLogs] = useState<ANPRLogEntry[]>([])
  const [showPlateDatabase, setShowPlateDatabase] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, tracksRes, platesRes] = await Promise.all([
        fetch(`${API_URL}/api/anpr/statistics`).catch(() => ({ json: () => null })),
        fetch(`${API_URL}/api/anpr/tracks`).catch(() => ({ json: () => ({ tracks: [] }) })),
        fetch(`${API_URL}/api/anpr/plates?limit=50`).catch(() => ({ json: () => ({ plates: [] }) }))
      ])
      
      const statsData = await statsRes.json()
      const tracksData = await tracksRes.json()
      const platesData = await platesRes.json()
      
      if (statsData) setStats(statsData)
      setTracks(tracksData.tracks || [])
      
      const newPlates = (platesData.plates || []).map((p: any) => ({
        id: p.id || Math.random().toString(),
        plate: p.plate || 'UNKNOWN',
        timestamp: p.last_seen || p.first_seen || new Date().toISOString(),
        camera: p.camera_id || 'N/A',
        confidence: p.last_confidence || p.detections?.[0]?.confidence || 0,
        verified: p.last_confidence > 0.85
      }))
      setPlates(newPlates)
      setLogs(prev => [...newPlates.slice(0, 5), ...prev].slice(0, 50))
    } catch (error) {
      console.error('Failed to fetch ANPR data:', error)
    }
  }

  useEffect(() => {
    if (isPlaying) {
      startCameraFeed()
    } else {
      stopCameraFeed()
    }
    return () => stopCameraFeed()
  }, [isPlaying, selectedCamera])

  const startCameraFeed = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const loadFrame = async () => {
      try {
        const response = await fetch(`${API_URL}/api/cameras/${selectedCamera}/snapshot`)
        const data = await response.json()
        
        if (data.image) {
          const img = new Image()
          img.onload = () => {
            ctx.fillStyle = '#111111'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
            const x = (canvas.width - img.width * scale) / 2
            const y = (canvas.height - img.height * scale) / 2
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
            
            drawOverlays(ctx, img.width, img.height, scale, x, y)
          }
          img.src = `data:image/jpeg;base64,${data.image}`
        }
      } catch (e) {
        ctx.fillStyle = '#111111'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#0F6A3D'
        ctx.font = '20px Montserrat'
        ctx.textAlign = 'center'
        ctx.fillText('WAITING FOR FEED...', canvas.width / 2, canvas.height / 2)
      }
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(loadFrame)
      }
    }
    
    loadFrame()
  }

  const stopCameraFeed = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const drawOverlays = (ctx: CanvasRenderingContext2D, imgW: number, imgH: number, scale: number, offsetX: number, offsetY: number) => {
    const kenyanGreen = '#0F6A3D'
    const alertRed = '#BB1E10'
    const trackingBlue = '#00BFFF'
    const verifiedGreen = '#00FF7F'
    
    ctx.strokeStyle = kenyanGreen
    ctx.lineWidth = 2
    
    ctx.font = 'bold 14px Montserrat'
    ctx.fillStyle = kenyanGreen
    ctx.textAlign = 'left'
    ctx.fillText(`CAMERA: ${selectedCamera.toUpperCase()}`, 20, 30)
    
    const time = new Date().toLocaleString()
    ctx.font = '12px Fira Code'
    ctx.fillStyle = '#F2F2F2'
    ctx.textAlign = 'right'
    ctx.fillText(time, ctx.canvas.width - 20, 30)
    
    const pulse = Math.sin(Date.now() / 500) > 0
    ctx.fillStyle = pulse ? '#00FF00' : '#006400'
    ctx.beginPath()
    ctx.arc(ctx.canvas.width - 100, 25, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#00FF00'
    ctx.font = 'bold 10px Fira Code'
    ctx.fillText('LIVE', ctx.canvas.width - 85, 28)
    
    ctx.fillStyle = '#111111'
    ctx.fillRect(0, ctx.canvas.height - 100, ctx.canvas.width, 100)
    ctx.strokeStyle = kenyanGreen
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, ctx.canvas.height - 100)
    ctx.lineTo(ctx.canvas.width, ctx.canvas.height - 100)
    ctx.stroke()
    
    ctx.fillStyle = kenyanGreen
    ctx.font = 'bold 14px Montserrat'
    ctx.textAlign = 'left'
    ctx.fillText('ACTIVE TARGETS', 20, ctx.canvas.height - 75)
    
    const displayTracks = tracks.slice(0, 4)
    displayTracks.forEach((track, i) => {
      const x = 20 + i * (ctx.canvas.width / 4)
      const color = track.verified ? verifiedGreen : trackingBlue
      
      ctx.fillStyle = color
      ctx.font = 'bold 16px Montserrat'
      ctx.fillText(track.plate || 'UNKNOWN', x, ctx.canvas.height - 50)
      
      ctx.font = '10px Fira Code'
      ctx.fillStyle = '#F2F2F2'
      ctx.fillText(`ID:${String(track.track_id).padStart(3, '0')} | ${(track.confidence * 100).toFixed(0)}%`, x, ctx.canvas.height - 32)
      
      if (track.verified) {
        ctx.fillStyle = verifiedGreen
        ctx.fillText('✓ VERIFIED', x, ctx.canvas.height - 18)
      }
    })
  }

  const getSeverityColor = (conf: number) => {
    if (conf > 0.85) return 'text-green-400'
    if (conf > 0.7) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#F2F2F2] font-sans">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b-2 border-[#0F6A3D] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#0F6A3D]" />
            <div>
              <h1 className="text-xl font-bold font-[Montserrat] tracking-wider">
                KENYA OVERWATCH
              </h1>
              <p className="text-xs text-[#0F6A3D] font-[Fira Code]">
                ANPR COMMAND CENTER
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#0F6A3D] px-3 py-1 rounded">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-bold">SYSTEM ONLINE</span>
            </div>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 bg-[#1a1a1a] rounded hover:bg-[#2a2a2a]"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button 
              onClick={fetchData}
              className="p-2 bg-[#1a1a1a] rounded hover:bg-[#2a2a2a]"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-4">
          {/* Metrics Row */}
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-[#0F6A3D]">
              <div className="flex items-center gap-2 text-[#0F6A3D] mb-2">
                <Car className="w-4 h-4" />
                <span className="text-xs font-[Montserrat]">VEHICLES TODAY</span>
              </div>
              <div className="text-2xl font-bold font-[Montserrat]">{stats?.vehicles_today || 0}</div>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-[#00BFFF]">
              <div className="flex items-center gap-2 text-[#00BFFF] mb-2">
                <Target className="w-4 h-4" />
                <span className="text-xs font-[Montserrat]">ACTIVE TRACKS</span>
              </div>
              <div className="text-2xl font-bold font-[Montserrat]">{stats?.active_tracks || 0}</div>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-[#00FF7F]">
              <div className="flex items-center gap-2 text-[#00FF7F] mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-[Montserrat]">AVG CONFIDENCE</span>
              </div>
              <div className="text-2xl font-bold font-[Montserrat]">
                {(stats?.avg_confidence || 0).toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-[#FFD700]">
              <div className="flex items-center gap-2 text-[#FFD700] mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-[Montserrat]">FPS</span>
              </div>
              <div className="text-2xl font-bold font-[Montserrat]">{(stats?.fps || 0).toFixed(1)}</div>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-[#FF6B6B]">
              <div className="flex items-center gap-2 text-[#FF6B6B] mb-2">
                <Cpu className="w-4 h-4" />
                <span className="text-xs font-[Montserrat]">LATENCY</span>
              </div>
              <div className="text-2xl font-bold font-[Montserrat]">
                {(stats?.latency_ms || 0).toFixed(0)}ms
              </div>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-[#BB1E10]">
              <div className="flex items-center gap-2 text-[#BB1E10] mb-2">
                <Database className="w-4 h-4" />
                <span className="text-xs font-[Montserrat]">TOTAL PLATES</span>
              </div>
              <div className="text-2xl font-bold font-[Montserrat]">{stats?.total_plates || 0}</div>
            </div>
          </div>

          {/* Camera Feed */}
          <div className="bg-[#1a1a1a] rounded-lg overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-2 bg-[#0F6A3D]">
              <div className="flex items-center gap-4">
                <Camera className="w-5 h-5" />
                <select 
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="bg-[#1a1a1a] text-white px-3 py-1 rounded text-sm font-[Fira Code]"
                >
                  <option value="cam_001">CAM_001 - CBD</option>
                  <option value="cam_002">CAM_002 - AIRPORT</option>
                  <option value="cam_003">CAM_003 - PORT</option>
                  <option value="cam_004">CAM_004 - WESTLANDS</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1 hover:bg-[#0a4a2d] rounded"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="relative">
              <canvas 
                ref={canvasRef}
                width={800}
                height={450}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Active Tracks & Logs */}
          <div className="grid grid-cols-2 gap-4">
            {/* Active Tracks */}
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <h3 className="font-bold text-[#0F6A3D] mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                ACTIVE TARGETS
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tracks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No active targets</p>
                ) : (
                  tracks.map(track => (
                    <div 
                      key={track.track_id}
                      className="bg-[#0a0a0a] p-3 rounded border-l-4 border-[#00BFFF]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-[Montserrat] text-lg">
                          {track.plate || 'UNKNOWN'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          track.verified 
                            ? 'bg-green-900 text-green-400' 
                            : 'bg-blue-900 text-blue-400'
                        }`}>
                          {track.verified ? '✓ VERIFIED' : 'TRACKING'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 font-[Fira Code]">
                        <span>ID: {String(track.track_id).padStart(3, '0')}</span>
                        <span>{(track.confidence * 100).toFixed(1)}%</span>
                        <span>{track.camera_id}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detection Log */}
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <h3 className="font-bold text-[#BB1E10] mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                DETECTION LOG
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto font-[Fira Code] text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No detections yet</p>
                ) : (
                  logs.map(log => (
                    <div 
                      key={log.id}
                      className="flex items-center justify-between bg-[#0a0a0a] p-2 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-[#00BFFF]" />
                        <span className="font-bold">{log.plate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className={getSeverityColor(log.confidence)}>
                          {(log.confidence * 100).toFixed(0)}%
                        </span>
                        <span>{log.camera}</span>
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-80 bg-[#1a1a1a] p-4 border-l border-[#0F6A3D]">
          <h3 className="font-bold text-[#0F6A3D] mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            PLATE DATABASE
          </h3>
          
          <div className="space-y-2">
            {plates.slice(0, 20).map(plate => (
              <div 
                key={plate.id}
                className="bg-[#0a0a0a] p-2 rounded flex items-center justify-between"
              >
                <span className="font-bold font-[Montserrat]">{plate.plate}</span>
                <div className="flex items-center gap-2">
                  {plate.verified && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(plate.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => setShowPlateDatabase(!showPlateDatabase)}
            className="w-full mt-4 bg-[#0F6A3D] hover:bg-[#0a4a2d] py-2 rounded text-sm font-bold"
          >
            VIEW ALL PLATES ({plates.length})
          </button>
        </aside>
      </div>
    </div>
  )
}

function Database({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  )
}
