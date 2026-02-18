import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface TrendData {
  date: string
  incidents: number
  alerts: number
  evidence_packages: number
}

interface StatisticsProps {
  refreshInterval?: number
}

const Statistics: React.FC<StatisticsProps> = ({ refreshInterval = 30000 }) => {
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsRes, summaryRes] = await Promise.all([
          fetch('http://localhost:8000/api/statistics/trends'),
          fetch('http://localhost:8000/api/statistics/summary')
        ])
        
        const trends = await trendsRes.json()
        const sum = await summaryRes.json()
        
        setTrendData(trends.trends || [])
        setSummary(sum)
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm">Total Incidents</h3>
          <p className="text-2xl font-bold text-white">{summary?.incidents?.total || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm">High Risk</h3>
          <p className="text-2xl font-bold text-red-500">{summary?.incidents?.high_risk || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm">Pending Review</h3>
          <p className="text-2xl font-bold text-yellow-500">{summary?.incidents?.pending_review || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm">Evidence Packages</h3>
          <p className="text-2xl font-bold text-blue-500">{summary?.evidence?.total_packages || 0}</p>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4">7-Day Incident Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="alerts" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4">Evidence Packages</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="evidence_packages" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Stats */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Uptime</p>
            <p className="text-white font-medium">{summary?.system?.uptime_hours || 0}h</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Cameras</p>
            <p className="text-white font-medium">{summary?.system?.total_cameras || 0}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Active Cameras</p>
            <p className="text-green-500 font-medium">{summary?.system?.active_cameras || 0}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Average FPS</p>
            <p className="text-white font-medium">{summary?.system?.average_fps || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Statistics
