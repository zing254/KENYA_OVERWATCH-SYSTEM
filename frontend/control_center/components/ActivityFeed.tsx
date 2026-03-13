'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Activity, AlertTriangle, Car, MapPin, Clock, User, Bell, 
  Zap, MessageSquare, CheckCircle, XCircle, Phone, RefreshCw
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface ActivityItem {
  id: string
  type: 'incident' | 'violation' | 'citizen_report' | 'alert' | 'dispatch' | 'system'
  title: string
  description: string
  location?: string
  timestamp: string
  severity?: string
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const wsRef = useRef<WebSocket | null>(null)

  const fetchActivities = async () => {
    try {
      const [incidentsRes, violationsRes, reportsRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/api/incidents`),
        fetch(`${API_URL}/api/violations`),
        fetch(`${API_URL}/api/citizen/reports`),
        fetch(`${API_URL}/api/alerts`),
      ])

      const incidents = await incidentsRes.json()
      const violations = await violationsRes.json()
      const reports = await reportsRes.json()
      const alerts = await alertsRes.json()

      const newActivities: ActivityItem[] = []

      ;(incidents.incidents || []).slice(0, 5).forEach((item: any) => {
        newActivities.push({
          id: item.incident_id || item.id,
          type: 'incident',
          title: `New ${item.incident_type || 'incident'}`,
          description: item.description || item.title,
          location: item.location,
          timestamp: item.created_at,
          severity: item.severity
        })
      })

      ;(violations.violations || []).slice(0, 5).forEach((item: any) => {
        newActivities.push({
          id: item.violation_id || item.id,
          type: 'violation',
          title: `${item.violation_type || 'Violation'} Detected`,
          description: `Vehicle: ${item.vehicle_plate}`,
          location: item.location,
          timestamp: item.created_at,
          severity: 'medium'
        })
      })

      ;(reports.reports || []).slice(0, 5).forEach((item: any) => {
        newActivities.push({
          id: item.id,
          type: 'citizen_report',
          title: `Citizen Report: ${item.type}`,
          description: item.description,
          location: item.location,
          timestamp: item.created_at,
          severity: 'low'
        })
      })

      ;(alerts.alerts || []).slice(0, 5).forEach((item: any) => {
        newActivities.push({
          id: item.id,
          type: 'alert',
          title: item.title,
          description: item.message,
          location: item.location,
          timestamp: item.created_at,
          severity: item.severity
        })
      })

      newActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setActivities(newActivities.slice(0, 20))
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    const interval = setInterval(fetchActivities, 10000)
    return () => clearInterval(interval)
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case 'incident': return <AlertTriangle className="w-4 h-4" />
      case 'violation': return <Car className="w-4 h-4" />
      case 'citizen_report': return <User className="w-4 h-4" />
      case 'alert': return <Bell className="w-4 h-4" />
      case 'dispatch': return <MapPin className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getColor = (type: string, severity?: string) => {
    if (severity === 'critical' || severity === 'high') return 'text-red-400 bg-red-400/10'
    if (severity === 'medium') return 'text-yellow-400 bg-yellow-400/10'
    switch (type) {
      case 'incident': return 'text-orange-400 bg-orange-400/10'
      case 'violation': return 'text-blue-400 bg-blue-400/10'
      case 'citizen_report': return 'text-purple-400 bg-purple-400/10'
      case 'alert': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
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

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter)

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Live Activity Feed</h3>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        </div>
        <button
          onClick={fetchActivities}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-2 border-b border-gray-700 flex gap-1 overflow-x-auto">
        {['all', 'incident', 'violation', 'citizen_report', 'alert'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
              filter === type 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {type === 'all' ? 'All' : type.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
            <p className="text-gray-400 text-sm mt-2">Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-gray-400 text-sm mt-2">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredActivities.map(activity => (
              <div 
                key={activity.id} 
                className="p-3 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getColor(activity.type, activity.severity)}`}>
                    {getIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-sm font-medium truncate">
                        {activity.title}
                      </p>
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs truncate mt-0.5">
                      {activity.description}
                    </p>
                    {activity.location && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{activity.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
