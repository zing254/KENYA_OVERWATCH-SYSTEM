import React, { useState, useEffect, useCallback } from 'react'
import { Bell, X, Check, AlertTriangle, Info, AlertCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

const playSound = (soundType: string, volume: number = 1.0) => {
  if (typeof window === 'undefined') return

  const sounds: Record<string, string> = {
    emergency: '/sounds/emergency.mp3',
    alert: '/sounds/alert.mp3',
    warning: '/sounds/warning.mp3',
    notification: '/sounds/notification.mp3',
    incident: '/sounds/incident.mp3',
    dispatch: '/sounds/dispatch.mp3',
    road_sign: '/sounds/road_sign.mp3',
    speed_camera: '/sounds/speed_camera.mp3',
  }

  const soundPath = sounds[soundType]
  if (soundPath) {
    const audio = new Audio(soundPath)
    audio.volume = volume
    audio.play().catch(e => console.error('Error playing sound:', e))
  }
}

interface Notification {
  notification_id: string
  type: 'alert' | 'incident' | 'system' | 'evidence'
  title: string
  message: string
  read: boolean
  timestamp: string
  notification_type?: string
  severity?: string
}

interface NotificationPanelProps {
  refreshInterval?: number
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ refreshInterval = 30000 }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications?limit=20&user_id=admin`)
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchNotifications, refreshInterval])

  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'notification') {
      const notif = data.data
      const newNotification: Notification = {
        notification_id: notif.notification_id,
        type: notif.notification_type || 'alert',
        title: notif.title,
        message: notif.message,
        read: false,
        timestamp: notif.timestamp,
        notification_type: notif.notification_type,
        severity: notif.severity
      }
      setNotifications(prev => [newNotification, ...prev].slice(0, 50))
      setUnreadCount(prev => prev + 1)
      
      const soundMap: Record<string, string> = {
        'emergency': 'emergency',
        'critical': 'emergency',
        'alert': 'alert',
        'incident': 'incident',
        'warning': 'warning',
        'dispatch': 'dispatch',
        'road_sign': 'road_sign',
        'speed_camera': 'speed_camera'
      }
      const soundType = soundMap[notif.notification_type] || soundMap[notif.severity] || 'notification'
      playSound(soundType, 0.7)
    } else if (data.type === 'sound_alert') {
      const sound = data.data
      playSound(sound.sound_type, sound.volume)
    }
  }, [])

  useEffect(() => {
    const wsUrl = API_URL.replace('http', 'ws') + `/api/v1/notifications/ws/notifications/admin`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('Notifications WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('Notifications WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [handleWebSocketMessage])

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read?user_id=admin`, { method: 'POST' })
      setNotifications(prev => 
        prev.map(n => n.notification_id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/read-all?user_id=admin`, { method: 'POST' })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'incident': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'system': return <Info className="w-5 h-5 text-blue-500" />
      case 'evidence': return <Check className="w-5 h-5 text-green-500" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.notification_id}
                  className={`p-3 border-b border-gray-700 hover:bg-gray-750 ${
                    !notification.read ? 'bg-gray-750' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'text-white font-medium' : 'text-gray-300'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.notification_id)}
                        className="flex-shrink-0 text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default NotificationPanel
