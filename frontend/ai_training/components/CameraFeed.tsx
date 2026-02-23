'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Play, Pause, Rewind, FastForward, Volume2, VolumeX, Maximize, ZoomIn, ZoomOut, 
  Settings, SkipBack, SkipForward, RotateCcw, Eye, AlertTriangle, Bookmark, Grid,
  Camera, Video, Disc, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Circle, Square, Clock, Download, Trash2, Phone
} from 'lucide-react'

interface Detection {
  id: string
  type: string
  confidence: number
  timestamp: Date
  bbox?: { x: number; y: number; w: number; h: number }
  plate?: string
}

interface CameraFeedProps {
  cameraId: string
  cameraName: string
  cameraType?: 'fixed' | 'ptz' | 'mobile-test' | 'speed' | 'traffic'
  onClose?: () => void
}

export default function CameraFeed({ cameraId, cameraName, cameraType = 'fixed', onClose }: CameraFeedProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(3600)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [ptzPosition, setPtzPosition] = useState({ x: 50, y: 50 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [detections, setDetections] = useState<Detection[]>([])
  const [showDetections, setShowDetections] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [showPTZ, setShowPTZ] = useState(false)
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('')
  const [streamQuality, setStreamQuality] = useState<'480p' | '720p' | '1080p' | '4k'>('720p')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const recordingInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setCurrentTimestamp(new Date().toLocaleString())
    const timer = setInterval(() => setCurrentTimestamp(new Date().toLocaleString()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current)
      }
      setRecordDuration(0)
    }
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current)
    }
  }, [isRecording])

  useEffect(() => {
    if (!showDetections || !isPlaying) return
    const interval = setInterval(() => {
      const types = ['person', 'vehicle', 'licensePlate']
      const type = types[Math.floor(Math.random() * types.length)]
      const newDetection: Detection = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        confidence: 0.7 + Math.random() * 0.3,
        timestamp: new Date(),
        bbox: {
          x: Math.random() * 60 + 20,
          y: Math.random() * 40 + 20,
          w: Math.random() * 20 + 10,
          h: Math.random() * 30 + 15
        },
        plate: type === 'licensePlate' ? `KAA ${Math.floor(Math.random() * 900) + 100}${String.fromCharCode(65 + Math.floor(Math.random() * 8))}` : undefined
      }
      setDetections(prev => [...prev.slice(-10), newDetection])
    }, 2000)
    return () => clearInterval(interval)
  }, [showDetections, isPlaying])

  const togglePlay = () => setIsPlaying(!isPlaying)
  const toggleMute = () => setIsMuted(!isMuted)
  
  const handleSeek = (time: number) => setCurrentTime(time)
  const handleSkipBack = () => setCurrentTime(Math.max(0, currentTime - 30))
  const handleSkipForward = () => setCurrentTime(Math.min(duration, currentTime + 30))
  
  const handleRewind = () => {
    const speeds = [0.25, 0.5, 1, 1.5, 2, 4]
    const idx = speeds.indexOf(playbackSpeed)
    setPlaybackSpeed(speeds[Math.max(0, idx - 1)])
  }
  
  const handleFastForward = () => {
    const speeds = [0.25, 0.5, 1, 1.5, 2, 4]
    const idx = speeds.indexOf(playbackSpeed)
    setPlaybackSpeed(speeds[Math.min(speeds.length - 1, idx + 1)])
  }
  
  const handleZoomIn = () => setZoom(prev => Math.min(4, prev + 0.25))
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.25))
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); setPtzPosition({ x: 50, y: 50 }) }
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen)
  const addBookmark = () => setBookmarks(prev => [...prev, currentTime].sort((a, b) => a - b))

  const handleScreenshot = () => {
    const screenshot = `screenshot_${cameraId}_${Date.now()}.png`
    setScreenshots(prev => [...prev, screenshot])
    console.log('Screenshot captured:', screenshot)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      console.log('Recording started')
    } else {
      console.log('Recording stopped')
    }
  }

  const handlePTZMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 10
    setPtzPosition(prev => ({
      x: direction === 'left' ? Math.max(0, prev.x - step) : direction === 'right' ? Math.min(100, prev.x + step) : prev.x,
      y: direction === 'up' ? Math.max(0, prev.y - step) : direction === 'down' ? Math.min(100, prev.y + step) : prev.y
    }))
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatRecordTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div 
        className="relative bg-black"
        style={{ 
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: `${ptzPosition.x}% ${ptzPosition.y}%`
        }}
      >
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
          <div className="text-center">
            <Eye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">Live Camera Feed</p>
            <p className="text-sm text-gray-600 mt-2">{cameraName}</p>
          </div>
          
          {cameraType === 'mobile-test' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
              <Phone className="w-3 h-3" />
              MOBILE-TEST
            </div>
          )}
          
          {showDetections && detections.map(det => (
            <div key={det.id} className="absolute border-2 rounded animate-fade-in" style={{
              left: `${det.bbox?.x || 50}%`, top: `${det.bbox?.y || 50}%`,
              width: `${det.bbox?.w || 20}%`, height: `${det.bbox?.h || 30}%`,
              borderColor: det.type === 'person' ? '#22c55e' : det.type === 'vehicle' ? '#3b82f6' : '#eab308',
              boxShadow: det.type === 'licensePlate' ? '0 0 10px #eab308' : 'none'
            }}>
              <div className="absolute -top-6 left-0 bg-black/80 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                {det.type === 'licensePlate' && <span className="text-yellow-400 font-mono">{det.plate}</span>}
                {det.type !== 'licensePlate' && <span>{det.type}</span>}
                <span className="opacity-70">{Math.round(det.confidence * 100)}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">LIVE</span>
          {isRecording && (
            <div className="flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded">
              <Disc className="w-3 h-3 animate-spin text-white" />
              <span className="text-white text-xs font-mono">{formatRecordTime(recordDuration)}</span>
            </div>
          )}
        </div>
        
        <div className="absolute top-4 right-4 text-white text-sm font-mono">{currentTimestamp || 'Loading...'}</div>
        
        {cameraType === 'ptz' && (
          <div className="absolute bottom-20 right-4 bg-black/80 rounded-lg p-2 opacity-0 hover:opacity-100 transition-opacity">
            <div className="grid grid-cols-3 gap-1">
              <div />
              <button onClick={() => handlePTZMove('up')} className="p-2 hover:bg-gray-700 rounded"><ChevronUp className="w-4 h-4 text-white" /></button>
              <div />
              <button onClick={() => handlePTZMove('left')} className="p-2 hover:bg-gray-700 rounded"><ChevronLeft className="w-4 h-4 text-white" /></button>
              <button onClick={() => setPtzPosition({ x: 50, y: 50 })} className="p-2 hover:bg-gray-700 rounded"><Circle className="w-4 h-4 text-white" /></button>
              <button onClick={() => handlePTZMove('right')} className="p-2 hover:bg-gray-700 rounded"><ChevronRight className="w-4 h-4 text-white" /></button>
              <div />
              <button onClick={() => handlePTZMove('down')} className="p-2 hover:bg-gray-700 rounded"><ChevronDown className="w-4 h-4 text-white" /></button>
              <div />
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 px-4 py-2">
        <div className="relative h-8 mb-2">
          <div className="absolute inset-x-0 h-2 bg-gray-700 rounded-full cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            handleSeek(((e.clientX - rect.left) / rect.width) * duration)
          }}>
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(currentTime / duration) * 100}%` }} />
            {bookmarks.map(bm => (
              <div key={bm} className="absolute top-0 w-1 h-full bg-yellow-500" style={{ left: `${(bm / duration) * 100}%` }} />
            ))}
          </div>
          <div className="absolute -bottom-4 left-0 text-xs text-gray-500">{formatTime(currentTime)}</div>
          <div className="absolute -bottom-4 right-0 text-xs text-gray-500">{formatTime(duration)}</div>
        </div>
      </div>

      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={handleSkipBack} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Skip back 30s">
            <SkipBack className="w-5 h-5" />
          </button>
          <button onClick={handleRewind} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Rewind">
            <Rewind className="w-5 h-5" />
          </button>
          <button onClick={togglePlay} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-transform hover:scale-105">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button onClick={handleFastForward} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Fast forward">
            <FastForward className="w-5 h-5" />
          </button>
          <button onClick={handleSkipForward} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Skip forward 30s">
            <SkipForward className="w-5 h-5" />
          </button>
          <span className="px-3 py-1 text-sm text-gray-400 bg-gray-700 rounded">{playbackSpeed}x</span>
          <button onClick={toggleMute} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="w-20 accent-blue-600" />
        </div>

        <div className="text-white text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</div>

        <div className="flex items-center gap-2">
          <button onClick={handleScreenshot} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Screenshot">
            <Camera className="w-5 h-5" />
          </button>
          <button onClick={toggleRecording} className={`p-2 rounded ${isRecording ? 'text-red-500 bg-red-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} title={isRecording ? 'Stop Recording' : 'Start Recording'}>
            {isRecording ? <Square className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          {cameraType === 'ptz' && (
            <button onClick={() => setShowPTZ(!showPTZ)} className={`p-2 rounded ${showPTZ ? 'text-blue-400 bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} title="PTZ Controls">
              <Grid className="w-5 h-5" />
            </button>
          )}
          <div className="h-6 w-px bg-gray-600" />
          <button onClick={handleZoomOut} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Zoom out">
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-gray-400 text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Zoom in">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={handleReset} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Reset">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => setShowDetections(!showDetections)} className={`p-2 rounded ${showDetections ? 'text-green-400 bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} title="Toggle detections">
            <AlertTriangle className="w-5 h-5" />
          </button>
          <button onClick={addBookmark} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Add bookmark">
            <Bookmark className="w-5 h-5" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Fullscreen">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {screenshots.length > 0 && (
        <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-gray-400 whitespace-nowrap">Screenshots:</span>
            {screenshots.map((ss, i) => (
              <div key={i} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
                <Camera className="w-3 h-3" />
                {ss.slice(0, 20)}...
                <button onClick={() => setScreenshots(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
