import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Activity, AlertTriangle, Package, Clock, Camera, Zap, TrendingUp, Shield } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface TrendData {
  date: string
  incidents: number
  alerts: number
  evidence_packages: number
}

interface StatisticsProps {
  refreshInterval?: number
}

const StatCard: React.FC<{
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  trend?: number
  delay?: number
}> = ({ title, value, icon: Icon, color, trend, delay = 0 }) => (
  <div 
    className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 hover:border-${color}/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-slide-up`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        {trend !== undefined && (
          <p className={`text-xs mt-2 flex items-center gap-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {trend >= 0 ? '+' : ''}{trend}% from last week
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-${color}/10`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
)

const Statistics: React.FC<StatisticsProps> = ({ refreshInterval = 30000 }) => {
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsRes, summaryRes] = await Promise.all([
          fetch(`${API_URL}/api/statistics/trends`),
          fetch(`${API_URL}/api/statistics/summary`)
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
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-ntsa-primaryLight border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards with animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Incidents" 
          value={summary?.incidents?.total || 0} 
          icon={AlertTriangle}
          color="text-red-400"
          trend={12}
          delay={0}
        />
        <StatCard 
          title="High Risk" 
          value={summary?.incidents?.high_risk || 0} 
          icon={Activity}
          color="text-orange-400"
          trend={-5}
          delay={100}
        />
        <StatCard 
          title="Pending Review" 
          value={summary?.incidents?.pending_review || 0} 
          icon={Clock}
          color="text-yellow-400"
          delay={200}
        />
        <StatCard 
          title="Evidence Packages" 
          value={summary?.evidence?.total_packages || 0} 
          icon={Package}
          color="text-blue-400"
          trend={8}
          delay={300}
        />
      </div>

      {/* Trend Charts with enhanced styling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 hover:border-ntsa-primaryLight/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-ntsa-primaryLight" />
              7-Day Incident Trends
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="alerts" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 hover:border-ntsa-primaryLight/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Evidence Packages
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="evidence_packages" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Stats with enhanced cards */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-ntsa-primaryLight" />
          System Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Uptime', value: `${summary?.system?.uptime_hours || 0}h`, icon: Clock },
            { label: 'Total Cameras', value: summary?.system?.total_cameras || 0, icon: Camera },
            { label: 'Active Cameras', value: summary?.system?.active_cameras || 0, icon: Zap, highlight: true },
            { label: 'Avg FPS', value: summary?.system?.average_fps || 0, icon: Activity },
          ].map((stat, idx) => (
            <div 
              key={stat.label}
              className={`p-4 rounded-xl bg-gray-700/30 border border-gray-600/30 hover:border-ntsa-primaryLight/50 transition-all duration-300 ${stat.highlight ? 'animate-pulse-slow' : ''}`}
            >
              <stat.icon className={`w-5 h-5 mb-2 ${stat.highlight ? 'text-green-400' : 'text-gray-400'}`} />
              <p className="text-gray-400 text-xs">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.highlight ? 'text-green-400' : 'text-white'}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Statistics
