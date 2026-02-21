'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Bell, AlertTriangle, Info, CheckCircle, XCircle, Eye, Filter } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Alert {
  id: string
  type: 'risk' | 'system' | 'incident'
  message: string
  severity: 'high' | 'medium' | 'low'
  timestamp: string
  read: boolean
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/alerts`)
      const data = await res.json()
      setAlerts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
      setAlerts([
        { id: 'alert_001', type: 'risk', message: 'High risk activity detected at CBD Main', severity: 'high', timestamp: new Date().toISOString(), read: false },
        { id: 'alert_002', type: 'system', message: 'Camera cam_004 went offline', severity: 'medium', timestamp: new Date(Date.now() - 180000).toISOString(), read: true },
        { id: 'alert_003', type: 'incident', message: 'New incident reported in Westlands', severity: 'low', timestamp: new Date(Date.now() - 300000).toISOString(), read: true },
        { id: 'alert_004', type: 'risk', message: 'Suspicious vehicle detected near bank', severity: 'high', timestamp: new Date(Date.now() - 600000).toISOString(), read: false },
        { id: 'alert_005', type: 'system', message: 'ANPR system calibration completed', severity: 'low', timestamp: new Date(Date.now() - 900000).toISOString(), read: true },
      ])
    }
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/alerts/${id}/acknowledge`, { method: 'POST' })
      setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a))
    } catch (error) {
      console.error('Error marking alert as read:', error)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-400" />
      case 'medium': return <Info className="w-5 h-5 text-yellow-400" />
      default: return <Bell className="w-5 h-5 text-blue-400" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      default: return 'border-l-blue-500'
    }
  }

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : filter === 'unread' 
      ? alerts.filter(a => !a.read) 
      : alerts.filter(a => a.severity === filter)

  const unreadCount = alerts.filter(a => !a.read).length

  return (
    <Layout title="Alerts - Kenya Overwatch">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Alerts</h1>
            <p className="text-gray-400">{unreadCount} unread alerts</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-700'} text-white text-sm`}>All</button>
            <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg ${filter === 'unread' ? 'bg-blue-600' : 'bg-gray-700'} text-white text-sm`}>Unread</button>
            <button onClick={() => setFilter('high')} className={`px-4 py-2 rounded-lg ${filter === 'high' ? 'bg-blue-600' : 'bg-gray-700'} text-white text-sm`}>High</button>
            <button onClick={() => setFilter('medium')} className={`px-4 py-2 rounded-lg ${filter === 'medium' ? 'bg-blue-600' : 'bg-gray-700'} text-white text-sm`}>Medium</button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`bg-gray-800 rounded-xl p-4 border border-gray-700 border-l-4 ${getSeverityColor(alert.severity)} ${!alert.read ? 'bg-gray-800' : 'opacity-70'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <p className="text-white">{alert.message}</p>
                      <p className="text-gray-500 text-sm mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  {!alert.read && (
                    <button 
                      onClick={() => markAsRead(alert.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Mark as read"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
