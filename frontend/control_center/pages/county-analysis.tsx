'use client'

import Layout from '@/components/Layout'
import { useState, useEffect, useRef } from 'react'
import { 
  Map, BarChart3, TrendingUp, AlertTriangle, Activity,
  Droplets, Wind, Thermometer, MapPin, Grid, List,
  ChevronDown, Search, Filter, RefreshCw, Download,
  Layers, PieChart, LineChart, AreaChart, Radar,
  FileText, Eye, Settings, TrendingDown
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, AreaChart as RechartsArea, Area,
  LineChart as RechartsLine, Line, RadarChart as RechartsRadar, Radar as RechartsRadarComp,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Treemap, ComposedChart,
  ScatterChart, Scatter
} from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface CountyData {
  code: string
  name: string
  region: string
  capital: string
  population: number
  road_density: number
  total_accidents: number
  total_violations: number
  fatalities: number
  injuries: number
  risk_score: number
  trend: string
}

interface RegionData {
  region: string
  county_count: number
  total_accidents: number
  total_violations: number
  total_fatalities: number
  total_injuries: number
  total_population: number
  risk_score: number
}

interface WeatherData {
  county: string
  region: string
  rainfall_risk: string
  flood_risk: string
  fog_visibility: string
  heat_wave_risk: string
  affected_roads: number
}

interface CongestionData {
  county: string
  region: string
  congestion_index: number
  avg_travel_time_min: number
  peak_hour_delay_min: number
  road_capacity_pct: number
  primary_congestion_cause: string
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#84cc16']
const REGION_COLORS = {
  'Central': '#3b82f6',
  'Coastal': '#22c55e',
  'Eastern': '#f97316',
  'North Eastern': '#ef4444',
  'Nyanza': '#8b5cf6',
  'Rift Valley': '#eab308',
  'Western': '#ec4899'
}

export default function CountyAnalysis() {
  const [counties, setCounties] = useState<CountyData[]>([])
  const [regions, setRegions] = useState<RegionData[]>([])
  const [weather, setWeather] = useState<WeatherData[]>([])
  const [congestion, setCongestion] = useState<CongestionData[]>([])
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'county' | 'region'>('overview')
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'risk' | 'accidents' | 'fatalities'>('risk')
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [reportType, setReportType] = useState('executive')
  const [showExportModal, setShowExportModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [summaryRes, regionRes, weatherRes, congestionRes] = await Promise.all([
        fetch(`${API_URL}/api/county/summary?period=month`),
        fetch(`${API_URL}/api/county/regions`),
        fetch(`${API_URL}/api/county/weather/impact`),
        fetch(`${API_URL}/api/county/traffic/congestion`)
      ])

      const summaryData = await summaryRes.json()
      const regionData = await regionRes.json()
      const weatherData = await weatherRes.json()
      const congestionData = await congestionRes.json()

      setCounties(summaryData.counties || [])
      setRegions(regionData.regions || [])
      setWeather(weatherData.weather_impact || [])
      setCongestion(congestionData.congestion_index || [])
    } catch (error) {
      console.error('Error loading county data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedCounties = [...counties].sort((a, b) => {
    if (sortBy === 'risk') return b.risk_score - a.risk_score
    if (sortBy === 'accidents') return b.total_accidents - a.total_accidents
    return b.fatalities - a.fatalities
  })

  const filteredCounties = sortedCounties.filter(c => {
    if (filterRegion !== 'all' && c.region !== filterRegion) return false
    if (filterRiskLevel === 'high' && c.risk_score < 60) return false
    if (filterRiskLevel === 'medium' && (c.risk_score < 40 || c.risk_score >= 60)) return false
    if (filterRiskLevel === 'low' && c.risk_score >= 40) return false
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const exportCountyReport = async (countyName: string, type: string) => {
    try {
      const response = await fetch(`${API_URL}/api/county/report/${countyName}?report_type=${type}`)
      const data = await response.json()
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${countyName}_${type}_report.json`
      a.click()
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  const exportCSV = async () => {
    try {
      const csvContent = [
        'County,Region,Population,Accidents,Violations,Fatalities,Injuries,Risk Score,Trend',
        ...filteredCounties.map(c => 
          `${c.name},${c.region},${c.population},${c.total_accidents},${c.total_violations},${c.fatalities},${c.injuries},${c.risk_score},${c.trend}`
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `county_analysis_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  const top10Counties = filteredCounties.slice(0, 10)
  const bottom10Counties = filteredCounties.slice(-10).reverse()

  const regionChartData = regions.map(r => ({
    name: r.region,
    accidents: r.total_accidents,
    fatalities: r.total_fatalities,
    risk: r.risk_score,
    population: r.total_population / 1000000
  }))

  const riskTreemapData = regions.map(r => ({
    name: r.region,
    children: sortedCounties
      .filter(c => c.region === r.region)
      .map(c => ({ name: c.name, size: c.risk_score }))
  }))

  const incidentTypeData = counties.length > 0 ? [
    { name: 'Central', value: counties.filter(c => c.region === 'Central').reduce((sum, c) => sum + c.total_accidents, 0) },
    { name: 'Coastal', value: counties.filter(c => c.region === 'Coastal').reduce((sum, c) => sum + c.total_accidents, 0) },
    { name: 'Eastern', value: counties.filter(c => c.region === 'Eastern').reduce((sum, c) => sum + c.total_accidents, 0) },
    { name: 'North Eastern', value: counties.filter(c => c.region === 'North Eastern').reduce((sum, c) => sum + c.total_accidents, 0) },
    { name: 'Nyanza', value: counties.filter(c => c.region === 'Nyanza').reduce((sum, c) => sum + c.total_accidents, 0) },
    { name: 'Rift Valley', value: counties.filter(c => c.region === 'Rift Valley').reduce((sum, c) => sum + c.total_accidents, 0) },
    { name: 'Western', value: counties.filter(c => c.region === 'Western').reduce((sum, c) => sum + c.total_accidents, 0) },
  ] : []

  const radarData = regions.slice(0, 6).map(r => ({
    subject: r.region.substring(0, 8),
    accidents: (r.total_accidents / 1000),
    fatalities: r.total_fatalities,
    violations: (r.total_violations / 5000),
    risk: r.risk_score / 20
  }))

  const trendData = counties.slice(0, 15).map((c, i) => ({
    name: c.name.substring(0, 6),
    accidents: c.total_accidents,
    violations: c.total_violations,
    risk: c.risk_score
  }))

  const heatmapData = weather.slice(0, 20).map(w => ({
    county: w.county.substring(0, 8),
    flood: w.flood_risk === 'High' ? 3 : w.flood_risk === 'Medium' ? 2 : 1,
    rainfall: w.rainfall_risk === 'High' ? 3 : w.rainfall_risk === 'Medium' ? 2 : 1,
    fog: w.fog_visibility === 'High' ? 3 : w.fog_visibility === 'Medium' ? 2 : 1,
    heat: w.heat_wave_risk === 'High' ? 3 : w.heat_wave_risk === 'Medium' ? 2 : 1
  }))

  const congestionBarData = congestion.slice(0, 15).map(c => ({
    name: c.county.substring(0, 10),
    index: c.congestion_index,
    delay: c.peak_hour_delay_min,
    capacity: c.road_capacity_pct
  }))

  const CustomTreemapContent = ({ x, y, width, height, name }: any) => {
    if (width < 40 || height < 20) return null
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} style={{ fill: '#1e293b', stroke: '#334155', strokeWidth: 1 }} />
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize={10}>
          {name}
        </text>
      </g>
    )
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-500'
    if (score >= 50) return 'text-orange-500'
    return 'text-green-500'
  }

  return (
    <Layout title="Kenya Overwatch - County Analysis">
      <div className="min-h-screen bg-gray-900">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">County Analysis Dashboard</h1>
              <p className="text-blue-200">Road Safety Analysis for All 47 Kenyan Counties</p>
            </div>
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-white text-gray-800 rounded-lg font-medium"
              >
                <option value="risk">Sort by Risk</option>
                <option value="accidents">Sort by Accidents</option>
                <option value="fatalities">Sort by Fatalities</option>
              </select>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-800 rounded-lg font-medium hover:bg-blue-50"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="p-4 md:p-6 space-y-6">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search county..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm w-full"
                  />
                </div>
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm w-full md:w-auto"
                >
                  <option value="all">All Regions</option>
                  <option value="Central">Central</option>
                  <option value="Coastal">Coastal</option>
                  <option value="Eastern">Eastern</option>
                  <option value="North Eastern">North Eastern</option>
                  <option value="Nyanza">Nyanza</option>
                  <option value="Rift Valley">Rift Valley</option>
                  <option value="Western">Western</option>
                </select>
                <select
                  value={filterRiskLevel}
                  onChange={(e) => setFilterRiskLevel(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk (60+)</option>
                  <option value="medium">Medium Risk (40-59)</option>
                  <option value="low">Low Risk (&lt;40)</option>
                </select>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:ml-auto">
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 w-full sm:w-auto"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="sm:hidden lg:inline">Export</span>
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4" />
                    <span className="sm:hidden lg:inline">CSV</span>
                  </button>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Showing {filteredCounties.length} of {counties.length} counties
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Counties</p>
                    <p className="text-2xl font-bold text-white">47</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Accidents</p>
                    <p className="text-2xl font-bold text-white">
                      {counties.reduce((sum, c) => sum + c.total_accidents, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Violations</p>
                    <p className="text-2xl font-bold text-white">
                      {counties.reduce((sum, c) => sum + c.total_violations, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Avg Risk Score</p>
                    <p className="text-2xl font-bold text-white">
                      {(counties.reduce((sum, c) => sum + c.risk_score, 0) / counties.length).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Top 10 Highest Risk Counties
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top10Counties} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="risk_score" fill="#ef4444" radius={[0, 4, 4, 0]} name="Risk Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  Top 10 Lowest Risk Counties
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bottom10Counties} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="risk_score" fill="#22c55e" radius={[0, 4, 4, 0]} name="Risk Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  Accidents by Region (Donut Chart)
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPie>
                    <Pie
                      data={incidentTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {incidentTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={REGION_COLORS[entry.name as keyof typeof REGION_COLORS] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Radar className="w-5 h-5 text-cyan-400" />
                  Regional Comparison Radar
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsRadar cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" stroke="#9ca3af" />
                    <PolarRadiusAxis stroke="#9ca3af" />
                    <RechartsRadarComp name="Accidents" dataKey="accidents" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                    <RechartsRadarComp name="Risk" dataKey="risk" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                    <Legend />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  </RechartsRadar>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-yellow-400" />
                  Accidents vs Violations Scatter
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="total_accidents" stroke="#9ca3af" name="Accidents" />
                    <YAxis dataKey="total_violations" stroke="#9ca3af" name="Violations" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Counties" data={counties.slice(0, 20)} fill="#3b82f6">
                      {counties.slice(0, 20).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={REGION_COLORS[entry.region as keyof typeof REGION_COLORS] || COLORS[index % COLORS.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Regional Statistics Comparison
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={regionChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis yAxisId="left" stroke="#9ca3af" />
                    <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="accidents" fill="#3b82f6" name="Accidents" />
                    <Line yAxisId="right" type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} name="Risk Score" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-400" />
                  Weather Risk Factors by County
                </h3>
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex text-xs text-gray-400 mb-1">
                    <div className="w-24"></div>
                    <div className="flex-1 grid grid-cols-4 gap-1 text-center">
                      <span>Flood</span>
                      <span>Rain</span>
                      <span>Fog</span>
                      <span>Heat</span>
                    </div>
                  </div>
                  {heatmapData.slice(0, 12).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-24 text-xs text-gray-300 truncate">{item.county}</div>
                      <div className="flex-1 grid grid-cols-4 gap-1">
                        {[
                          { v: item.flood, l: 'Flood' },
                          { v: item.rainfall, l: 'Rain' },
                          { v: item.fog, l: 'Fog' },
                          { v: item.heat, l: 'Heat' }
                        ].map((r, i) => (
                          <div
                            key={i}
                            className={`h-6 rounded ${
                              r.v === 3 ? 'bg-red-500' : r.v === 2 ? 'bg-yellow-500' : 'bg-green-500'
                            } opacity-80`}
                            title={`${r.l}: ${r.v === 3 ? 'High' : r.v === 2 ? 'Medium' : 'Low'}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4 mt-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded"></div> Low</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded"></div> Medium</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded"></div> High</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-400" />
                  Traffic Congestion Index
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsArea data={congestionBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="index" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} name="Congestion Index" />
                    <Area type="monotone" dataKey="delay" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} name="Peak Delay (min)" />
                  </RechartsArea>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <AreaChart className="w-5 h-5 text-pink-400" />
                  Risk vs Accidents Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLine data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis yAxisId="left" stroke="#9ca3af" />
                    <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="accidents" stroke="#ef4444" strokeWidth={2} name="Accidents" dot={{ r: 3 }} />
                    <Line yAxisId="left" type="monotone" dataKey="violations" stroke="#3b82f6" strokeWidth={2} name="Violations" dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="risk" stroke="#22c55e" strokeWidth={2} name="Risk Score" dot={{ r: 3 }} />
                  </RechartsLine>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Grid className="w-5 h-5 text-teal-400" />
                County Risk Treemap by Region
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <Treemap
                  data={riskTreemapData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#1e293b"
                  fill="#3b82f6"
                  content={<CustomTreemapContent />}
                >
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                </Treemap>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <List className="w-5 h-5 text-blue-400" />
                Complete County Rankings
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Rank</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">County</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Region</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Population</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Accidents</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Violations</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Fatalities</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Risk Score</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCounties.map((county, idx) => (
                      <tr key={county.code} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-3 px-4 text-white font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 text-white">{county.name}</td>
                        <td className="py-3 px-4 text-gray-400">{county.region}</td>
                        <td className="py-3 px-4 text-right text-gray-300">{(county.population / 1000).toFixed(0)}K</td>
                        <td className="py-3 px-4 text-right text-gray-300">{county.total_accidents}</td>
                        <td className="py-3 px-4 text-right text-gray-300">{county.total_violations}</td>
                        <td className="py-3 px-4 text-right text-red-400">{county.fatalities}</td>
                        <td className={`py-3 px-4 text-right font-bold ${getRiskColor(county.risk_score)}`}>
                          {county.risk_score.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`text-xs px-2 py-1 rounded ${
                            county.trend === 'increasing' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {county.trend}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Export County Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Select County</label>
                  <select
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    onChange={(e) => {
                      if (e.target.value) exportCountyReport(e.target.value, reportType)
                      setShowExportModal(false)
                    }}
                  >
                    <option value="">Choose a county...</option>
                    {counties.map(c => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="executive">Executive Summary</option>
                    <option value="comprehensive">Comprehensive</option>
                    <option value="hazard">Hazard Analysis</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="weather_impact">Weather Impact</option>
                    <option value="traffic">Traffic Analysis</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
