'use client'

import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { 
  Satellite, AlertTriangle, Layers, MapPin, RefreshCw, 
  Droplets, Mountain, Map, TreePine, Cloud,
  Eye, Filter, Download, Activity, TrendingUp
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, AreaChart as RechartsArea, Area,
  LineChart as RechartsLine, Line, RadarChart as RechartsRadar, Radar,
  PolarGrid, PolarAngleAxis, Legend
} from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface SatelliteImage {
  satellite_id: string
  satellite_type: string
  sensor: string
  acquisition_date: string
  cloud_coverage: number
  spatial_resolution: number
}

interface HazardDetection {
  id: string
  hazard_type: string
  severity: string
  confidence: number
  latitude: number
  longitude: number
  county: string
  roads_affected: string[]
}

interface CoverageStats {
  total_images: number
  by_satellite: Record<string, number>
  total_hazards: number
  hazard_types: Record<string, number>
  severity_distribution: Record<string, number>
  counties_affected: number
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

export default function SatelliteMonitoring() {
  const [imagery, setImagery] = useState<SatelliteImage[]>([])
  const [hazards, setHazards] = useState<HazardDetection[]>([])
  const [stats, setStats] = useState<CoverageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSatellite, setSelectedSatellite] = useState<string>('all')
  const [selectedHazardType, setSelectedHazardType] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [imageryRes, hazardsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/satellite/imagery`),
        fetch(`${API_URL}/api/satellite/hazards`),
        fetch(`${API_URL}/api/satellite/coverage/statistics`)
      ])

      const imageryData = await imageryRes.json()
      const hazardsData = await hazardsRes.json()
      const statsData = await statsRes.json()

      setImagery(imageryData.images || [])
      setHazards(hazardsData.hazards || [])
      setStats(statsData.statistics)
    } catch (error) {
      console.error('Error loading satellite data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredImagery = selectedSatellite === 'all' 
    ? imagery 
    : imagery.filter(img => img.satellite_type === selectedSatellite)

  const filteredHazards = hazards.filter(h => 
    selectedHazardType === 'all' || h.hazard_type === selectedHazardType
  )

  const hazardTypeData = stats ? Object.entries(stats.hazard_types).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value: value as number
  })) : []

  const severityData = stats ? Object.entries(stats.severity_distribution).map(([name, value]) => ({
    name,
    value: value as number
  })) : []

  const satelliteData = stats ? Object.entries(stats.by_satellite).map(([name, value]) => ({
    name,
    images: value as number
  })) : []

  const monthlyData = [
    { month: 'Jan', floods: 12, landslides: 5, roadDamage: 18 },
    { month: 'Feb', floods: 8, landslides: 3, roadDamage: 15 },
    { month: 'Mar', floods: 15, landslides: 8, roadDamage: 22 },
    { month: 'Apr', floods: 22, landslides: 12, roadDamage: 19 },
    { month: 'May', floods: 18, landslides: 6, roadDamage: 14 },
    { month: 'Jun', floods: 10, landslides: 4, roadDamage: 12 },
  ]

  const radarData = [
    { subject: 'Flood Detection', A: 85, B: 78 },
    { subject: 'Landslide', A: 72, B: 65 },
    { subject: 'Road Damage', A: 90, B: 82 },
    { subject: 'Erosion', A: 68, B: 75 },
    { subject: 'Vegetation', A: 55, B: 60 },
    { subject: 'Water Accum.', A: 78, B: 85 },
  ]

  return (
    <Layout title="Kenya Overwatch - Satellite Monitoring">
      <div className="min-h-screen bg-gray-900">
        <div className="bg-gradient-to-r from-purple-900 to-blue-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Satellite className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Satellite Monitoring</h1>
                <p className="text-blue-200">Real-time satellite imagery & hazard detection</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-white text-purple-800 rounded-lg font-medium hover:bg-blue-50"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Satellite className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Images</p>
                    <p className="text-2xl font-bold text-white">{stats?.total_images || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Hazards Detected</p>
                    <p className="text-2xl font-bold text-white">{stats?.total_hazards || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Droplets className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Flooding</p>
                    <p className="text-2xl font-bold text-white">{stats?.hazard_types?.Flooding || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Mountain className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Landslides</p>
                    <p className="text-2xl font-bold text-white">{stats?.hazard_types?.Landslide || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <MapPin className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Counties</p>
                    <p className="text-2xl font-bold text-white">{stats?.counties_affected || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Imagery by Satellite
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={satelliteData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="images" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Images" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Hazard Types Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPie>
                    <Pie
                      data={hazardTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {hazardTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Monthly Hazard Trends
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsArea data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="floods" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Floods" />
                    <Area type="monotone" dataKey="landslides" stackId="2" stroke="#f97316" fill="#f97316" fillOpacity={0.6} name="Landslides" />
                    <Area type="monotone" dataKey="roadDamage" stackId="3" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Road Damage" />
                  </RechartsArea>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Detection Capability Radar
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsRadar cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" stroke="#9ca3af" />
                    <Radar name="2025" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    <Radar name="2024" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                    <Legend />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  </RechartsRadar>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Severity Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={severityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" width={60} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                Available Satellite Imagery
              </h3>
              <div className="flex gap-4 mb-4">
                <select
                  value={selectedSatellite}
                  onChange={(e) => setSelectedSatellite(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="all">All Satellites</option>
                  <option value="Sentinel-1">Sentinel-1 (SAR)</option>
                  <option value="Sentinel-2">Sentinel-2 (Optical)</option>
                  <option value="Landsat-8">Landsat-8</option>
                  <option value="Landsat-9">Landsat-9</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Satellite ID</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Sensor</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Cloud %</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Resolution (m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredImagery.slice(0, 10).map((img) => (
                      <tr key={img.satellite_id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-3 px-4 text-white font-mono text-sm">{img.satellite_id}</td>
                        <td className="py-3 px-4 text-gray-300">{img.satellite_type}</td>
                        <td className="py-3 px-4 text-gray-300">{img.sensor}</td>
                        <td className="py-3 px-4 text-gray-300">{new Date(img.acquisition_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right text-gray-300">{img.cloud_coverage.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right text-gray-300">{img.spatial_resolution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Detected Hazards
              </h3>
              <div className="flex gap-4 mb-4">
                <select
                  value={selectedHazardType}
                  onChange={(e) => setSelectedHazardType(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="all">All Hazards</option>
                  <option value="Flooding">Flooding</option>
                  <option value="Landslide">Landslide</option>
                  <option value="Road Damage">Road Damage</option>
                  <option value="Water Accumulation">Water Accumulation</option>
                  <option value="Erosion">Erosion</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHazards.slice(0, 12).map((hazard) => (
                  <div 
                    key={hazard.id}
                    className={`p-4 rounded-lg border ${
                      hazard.severity === 'High' ? 'bg-red-500/10 border-red-500/30' :
                      hazard.severity === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-green-500/10 border-green-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-white font-medium">{hazard.hazard_type}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        hazard.severity === 'High' ? 'bg-red-500 text-white' :
                        hazard.severity === 'Medium' ? 'bg-yellow-500 text-black' :
                        'bg-green-500 text-white'
                      }`}>
                        {hazard.severity}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{hazard.county}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Confidence: {(hazard.confidence * 100).toFixed(0)}%</span>
                      <span>{hazard.roads_affected?.length || 0} roads affected</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
