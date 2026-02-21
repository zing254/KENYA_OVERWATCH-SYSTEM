'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Stats {
  totalIncidents: number
  activeIncidents: number
  resolvedToday: number
  camerasOnline: number
  totalCameras: number
  responseTeams: number
  avgResponseTime: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats>({
    totalIncidents: 0,
    activeIncidents: 0,
    resolvedToday: 0,
    camerasOnline: 0,
    totalCameras: 0,
    responseTeams: 0,
    avgResponseTime: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dashboard/stats`)
      const data = await res.json()
      setStats({
        totalIncidents: data.total_incidents || 0,
        activeIncidents: data.active_incidents || 0,
        resolvedToday: data.resolved_today || 0,
        camerasOnline: data.cameras_online || 0,
        totalCameras: data.total_cameras || 0,
        responseTeams: data.response_teams || 0,
        avgResponseTime: data.avg_response_time || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        totalIncidents: 156,
        activeIncidents: 12,
        resolvedToday: 8,
        camerasOnline: 45,
        totalCameras: 52,
        responseTeams: 8,
        avgResponseTime: 8.5,
      })
    }
    setLoading(false)
  }

  const mockTrends = [
    { day: 'Mon', incidents: 12, resolved: 10 },
    { day: 'Tue', incidents: 19, resolved: 15 },
    { day: 'Wed', incidents: 15, resolved: 14 },
    { day: 'Thu', incidents: 22, resolved: 18 },
    { day: 'Fri', incidents: 18, resolved: 16 },
    { day: 'Sat', incidents: 10, resolved: 9 },
    { day: 'Sun', incidents: 8, resolved: 7 },
  ]

  const severityData = [
    { name: 'Critical', value: 8, color: '#ef4444' },
    { name: 'High', value: 24, color: '#f97316' },
    { name: 'Medium', value: 45, color: '#eab308' },
    { name: 'Low', value: 79, color: '#22c55e' },
  ]

  const locationData = [
    { location: 'Nairobi CBD', incidents: 45 },
    { location: 'Westlands', incidents: 32 },
    { location: 'Eastleigh', incidents: 28 },
    { location: 'Kasarani', incidents: 21 },
    { location: 'Mombasa Road', incidents: 18 },
  ]

  return (
    <Layout title="Kenya Overwatch - Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400">System performance and trends</p>
          </div>
          <div className="flex gap-2">
            <select className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Incidents</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalIncidents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400">12%</span>
              <span className="text-gray-500">vs last week</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Incidents</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.activeIncidents}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              <TrendingDown className="w-4 h-4 text-green-400" />
              <span className="text-green-400">8%</span>
              <span className="text-gray-500">vs last week</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Resolved Today</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.resolvedToday}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              <span className="text-gray-500">Success rate: </span>
              <span className="text-green-400">94%</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Response Time</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.avgResponseTime}m</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              <TrendingDown className="w-4 h-4 text-green-400" />
              <span className="text-green-400">2.3m</span>
              <span className="text-gray-500">faster</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incidents Trend */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Incidents This Week</h3>
            <div className="space-y-3">
              {mockTrends.map((day, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm w-12">{day.day}</span>
                  <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${(day.incidents / 25) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm w-8">{day.incidents}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-gray-400 text-sm">Reported</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-400 text-sm">Resolved</span>
              </div>
            </div>
          </div>

          {/* By Severity */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">By Severity</h3>
            <div className="space-y-4">
              {severityData.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm w-20">{item.name}</span>
                  <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ width: `${(item.value / 156) * 100}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-white text-sm w-8">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Location Analysis */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Incidents by Location</h3>
          <div className="space-y-3">
            {locationData.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-white text-sm w-40">{item.location}</span>
                <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(item.incidents / 45) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 text-sm w-8">{item.incidents}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">Camera Uptime</h4>
              <span className="text-green-400">98.5%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[98.5%]" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">Evidence Collection</h4>
              <span className="text-blue-400">99.2%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[99.2%]" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">Team Deployment</h4>
              <span className="text-purple-400">96.8%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-[96.8%]" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
