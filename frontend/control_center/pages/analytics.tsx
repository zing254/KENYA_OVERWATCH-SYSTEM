'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { 
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Users, 
  Car, MapPin, Eye, Target, Zap, Navigation, RefreshCw, Download, Shield
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface Stats {
  totalIncidents: number
  activeIncidents: number
  resolvedToday: number
  camerasOnline: number
  camerasOffline?: number
  totalCameras: number
  responseTeams: number
  avgResponseTime: number
}

interface AnalyticsData {
  vehicleRankings: { type: string; count: number; percentage: number }[]
  roadAnalysis: { road: string; incidents: number; violations: number; riskScore: number }[]
  coverageGaps: { area: string; type: string; risk: string }[]
  timePatterns: { hour: number; incidents: number }[]
  responseMetrics: { team: string; avgTime: number; responses: number }[]
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4']

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
  const [dateRange, setDateRange] = useState('7d')
  const [activeTab, setActiveTab] = useState('overview')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetchData()
    loadAnalytics()
  }, [dateRange])

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
        totalIncidents: 1247,
        activeIncidents: 23,
        resolvedToday: 89,
        camerasOnline: 45,
        totalCameras: 52,
        responseTeams: 24,
        avgResponseTime: 8.2,
      })
    }
    setLoading(false)
  }

  const loadAnalytics = async () => {
    const mockData: AnalyticsData = {
      vehicleRankings: [
        { type: 'Matatus', count: 245, percentage: 28 },
        { type: 'Saloon Cars', count: 198, percentage: 22 },
        { type: 'Motorcycles', count: 156, percentage: 18 },
        { type: 'Trucks', count: 89, percentage: 10 },
        { type: 'SUVs', count: 76, percentage: 9 },
        { type: 'Lorries', count: 54, percentage: 6 },
        { type: 'Trailers', count: 32, percentage: 4 },
        { type: 'Bicycles', count: 25, percentage: 3 },
      ],
      roadAnalysis: [
        { road: 'Kenyatta Avenue', incidents: 89, violations: 156, riskScore: 0.85 },
        { road: 'Mombasa Road', incidents: 76, violations: 134, riskScore: 0.78 },
        { road: 'Ngong Road', incidents: 65, violations: 112, riskScore: 0.72 },
        { road: 'University Road', incidents: 54, violations: 98, riskScore: 0.65 },
        { road: 'Westlands', incidents: 48, violations: 87, riskScore: 0.58 },
        { road: 'Kilimani', incidents: 42, violations: 76, riskScore: 0.52 },
        { road: 'Industrial Area', incidents: 38, violations: 65, riskScore: 0.45 },
        { road: 'Karen', incidents: 28, violations: 45, riskScore: 0.35 },
      ],
      coverageGaps: [
        { area: 'Eastleigh', type: 'No Patrol Cameras', risk: 'HIGH' },
        { area: 'Kasarani', type: 'Limited Coverage', risk: 'MEDIUM' },
        { area: 'Ruiru Road', type: 'No Fixed Cameras', risk: 'HIGH' },
        { area: 'Mombasa Highway', type: 'Speed Cameras Needed', risk: 'HIGH' },
        { area: 'Kikuyu', type: 'No Patrols', risk: 'MEDIUM' },
        { area: 'Athi River', type: 'Limited Coverage', risk: 'MEDIUM' },
      ],
      timePatterns: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        incidents: Math.floor(Math.random() * 30) + (i >= 7 && i <= 9 ? 25 : i >= 16 && i <= 19 ? 30 : 10)
      })),
      responseMetrics: [
        { team: 'Traffic Police', avgTime: 8.5, responses: 234 },
        { team: 'Rapid Response', avgTime: 6.2, responses: 156 },
        { team: 'Medical Emergency', avgTime: 12.4, responses: 89 },
        { team: 'Fire Department', avgTime: 10.1, responses: 67 },
        { team: 'Security', avgTime: 5.8, responses: 312 },
      ]
    }
    setAnalyticsData(mockData)
  }

  const getRiskColor = (score: number) => {
    if (score >= 0.75) return 'text-red-600 bg-red-100'
    if (score >= 0.5) return 'text-orange-600 bg-orange-100'
    return 'text-green-600 bg-green-100'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
            <p className="text-gray-500">Comprehensive system analytics and recommendations</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Incidents</p>
                <p className="text-2xl font-bold">{stats.totalIncidents.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12% from last period
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Response Time</p>
                <p className="text-2xl font-bold">{stats.avgResponseTime} min</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> -15% improvement
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Camera Coverage</p>
                <p className="text-2xl font-bold">{Math.round((stats.camerasOnline / stats.totalCameras) * 100)}%</p>
                <p className="text-sm text-orange-600 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {stats.totalCameras - stats.camerasOffline} gaps
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Teams</p>
                <p className="text-2xl font-bold">{stats.responseTeams}/28</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> 86% efficiency
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b overflow-x-auto">
          {['overview', 'vehicles', 'roads', 'coverage', 'response'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analyticsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Incident Patterns by Hour
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={analyticsData.timePatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="incidents" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Peak Hours:</strong> 7-9 AM and 4-7 PM - Consider increasing patrol coverage.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Offense by Vehicle Type
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analyticsData.vehicleRankings}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ type, percentage }) => `${type}: ${percentage}%`}
                  >
                    {analyticsData.vehicleRankings.map((entry, index) => (
                      <Cell key={entry.type} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === 'vehicles' && analyticsData && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Car className="w-5 h-5" />
              Top Offending Vehicle Types
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.vehicleRankings} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Recommendations
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Increase enforcement on matatu routes</li>
                  <li>• Target motorcycle riders for helmet checks</li>
                  <li>• Set up checkpoints for commercial vehicles</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Priority Actions
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Deploy traffic cops at major matatu stages</li>
                  <li>• Install speed cameras on highways</li>
                  <li>• Increase motorcycle patrol units</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Roads Tab */}
        {activeTab === 'roads' && analyticsData && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Road Safety Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Road</th>
                    <th className="text-right py-3 px-4">Incidents</th>
                    <th className="text-right py-3 px-4">Violations</th>
                    <th className="text-right py-3 px-4">Risk Score</th>
                    <th className="text-center py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.roadAnalysis.map((road, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{road.road}</td>
                      <td className="text-right py-3 px-4">{road.incidents}</td>
                      <td className="text-right py-3 px-4">{road.violations}</td>
                      <td className="text-right py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getRiskColor(road.riskScore)}`}>
                          {(road.riskScore * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <button className="text-blue-600 hover:underline text-sm">Add Camera</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                High Risk Roads requiring attention
              </h4>
              <p className="text-sm text-yellow-700">
                Kenyatta Avenue and Mombasa Road account for 35% of all incidents. 
                Consider installing additional speed cameras and increasing patrol frequency.
              </p>
            </div>
          </div>
        )}

        {/* Coverage Tab */}
        {activeTab === 'coverage' && analyticsData && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Coverage Gaps & Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.coverageGaps.map((gap, i) => (
                <div key={i} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{gap.area}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      gap.risk === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {gap.risk}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{gap.type}</p>
                  <button className="w-full py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                    Request Coverage
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Coverage Improvement Plan</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-600">5</p>
                  <p className="text-sm text-gray-600">New Cameras Planned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">8</p>
                  <p className="text-sm text-gray-600">Patrol Routes Added</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">3</p>
                  <p className="text-sm text-gray-600">Mobile Units Assigned</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Response Tab */}
        {activeTab === 'response' && analyticsData && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Response Team Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Average Response Time (minutes)</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.responseMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="team" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgTime" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="font-medium mb-3">Total Responses</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.responseMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="team" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="responses" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Performance Insights</h4>
              <p className="text-sm text-green-700">
                Security teams have the fastest response time (5.8 min) but handle the most incidents. 
                Consider redistributing load to reduce fatigue and improve coverage.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
