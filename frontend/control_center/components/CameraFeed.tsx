'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Rewind, FastForward, Volume2, VolumeX, Maximize, ZoomIn, ZoomOut, Settings, SkipBack, SkipForward, RotateCcw, Eye, AlertTriangle, Bookmark, Grid } from 'lucide-react'

interface Detection {
  id: string
  type: string
  confidence: number
  timestamp: Date
  bbox?: { x: number; y: number; w: number; h: number }
}

interface CameraFeedProps {
  cameraId: string
  cameraName: string
  onClose?: () => void
}

export default function CameraFeed({ cameraId, cameraName, onClose }: CameraFeedProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(3600)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [detections, setDetections] = useState<Detection[]>([])
  const [showDetections, setShowDetections] = useState(true)
  const [bookmarks, setBookmarks] = useState<number[]>([])

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
        }
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
    const speeds = [0.25, 0.5, 1, 1.5, 2]
    const idx = speeds.indexOf(playbackSpeed)
    setPlaybackSpeed(speeds[Math.max(0, idx - 1)])
  }
  
  const handleFastForward = () => {
    const speeds = [0.25, 0.5, 1, 1.5, 2]
    const idx = speeds.indexOf(playbackSpeed)
    setPlaybackSpeed(speeds[Math.min(speeds.length - 1, idx + 1)])
  }
  
  const handleZoomIn = () => setZoom(prev => Math.min(4, prev + 0.25))
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.25))
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }) }
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen)
  const addBookmark = () => setBookmarks(prev => [...prev, currentTime].sort((a, b) => a - b))

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="relative bg-black" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Eye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">Live Camera Feed</p>
            <p className="text-sm text-gray-600 mt-2">{cameraName}</p>
          </div>
        </div>
        
        {showDetections && detections.map(det => (
          <div key={det.id} className="absolute border-2 rounded" style={{
            left: `${det.bbox?.x || 50}%`, top: `${det.bbox?.y || 50}%`,
            width: `${det.bbox?.w || 20}%`, height: `${det.bbox?.h || 30}%`,
            borderColor: det.type === 'person' ? '#22c55e' : det.type === 'vehicle' ? '#3b82f6' : '#eab308'
          }}>
            <div className="absolute -top-6 left-0 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
              {det.type} {Math.round(det.confidence * 100)}%
            </div>
          </div>
        ))}

        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">LIVE</span>
        </div>
        <div className="absolute top-4 right-4 text-white text-sm font-mono">{new Date().toLocaleString()}</div>
      </div>

      <div className="bg-gray-800 px-4 py-2">
        <div className="relative h-8 mb-2">
          <div className="absolute inset-x-0 h-2 bg-gray-700 rounded-full cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            handleSeek(((e.clientX - rect.left) / rect.width) * duration)
          }}>
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }} />
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
          <button onClick={togglePlay} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full">
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
    </div>
  )
}
