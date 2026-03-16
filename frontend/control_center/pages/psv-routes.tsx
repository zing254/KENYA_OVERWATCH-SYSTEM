'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import dynamic from 'next/dynamic'
import {
  Bus, MapPin, Search, RefreshCw, Navigation, Clock, Users,
  Route, ChevronDown, ChevronUp, Star, AlertTriangle, Filter,
  ArrowRight, Zap, TrendingUp, Layers
} from 'lucide-react'

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface PSVRoute {
  route_id: string
  route_number: string
  line: string
  corridor: string
  cbd_stage: string
  origin: string
  destination: string
  key_stages: string[]
  fare_min_ksh: number
  fare_max_ksh: number
  distance_km: number
  vehicle_type: string
}

interface Stage {
  name: string
  location: string
  directions: string[]
  latitude: number
  longitude: number
  routes: string[]
  route_count: number
}

interface SACCO {
  sacco_id: string
  name: string
  full_name: string
  routes: string[]
  primary_corridor: string
  cbd_stage: string
  fleet_estimate: number
  vehicle_type: string
  famous_vehicles: string[]
  founded_year: number
  is_electric: boolean
}

interface Hotspot {
  route: string
  location: string
  lat: number
  lng: number
  crashes_2024: number
  severity: string
  cause_primary: string
}

interface NetworkSummary {
  total_routes: number
  total_stages: number
  total_saccos: number
  intercity_routes: number
  crash_hotspots: number
  lines: Record<string, number>
  electric_saccos: number
}

export default function PSVRoutesPage() {
  const [routes, setRoutes] = useState<PSVRoute[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [saccos, setSaccos] = useState<SACCO[]>([])
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [summary, setSummary] = useState<NetworkSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLine, setSelectedLine] = useState<string>('all')
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'routes' | 'stages' | 'saccos' | 'hotspots'>('routes')
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [summaryRes, routesRes, stagesRes, saccosRes, hotspotsRes] = await Promise.all([
        fetch(`${API_URL}/api/psv/network-summary`),
        fetch(`${API_URL}/api/psv/routes`),
        fetch(`${API_URL}/api/psv/stages`),
        fetch(`${API_URL}/api/psv/saccos`),
        fetch(`${API_URL}/api/psv/hotspots`),
      ])

      const summaryData = await summaryRes.json()
      const routesData = await routesRes.json()
      const stagesData = await stagesRes.json()
      const saccosData = await saccosRes.json()
      const hotspotsData = await hotspotsRes.json()

      setSummary(summaryData)
      setRoutes(routesData.routes || [])
      setStages(stagesData.stages || [])
      setSaccos(saccosData.saccos || [])
      setHotspots(hotspotsData.hotspots || [])
    } catch (error) {
      console.error('Error loading PSV data:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchRoutes = async () => {
    if (!searchQuery.trim()) {
      loadData()
      return
    }
    try {
      const res = await fetch(`${API_URL}/api/psv/routes/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setRoutes(data.routes || [])
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const filteredRoutes = routes.filter(r => {
    if (selectedLine !== 'all' && r.line !== selectedLine) return false
    if (selectedStage !== 'all' && r.cbd_stage !== selectedStage) return false
    return true
  })

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'bus': return <Bus className="w-4 h-4" />
      case 'minibus_14': return <Bus className="w-3 h-3" />
      default: return <Bus className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'low': return 'text-green-400 bg-green-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const lineColors: Record<string, string> = {
    A: 'bg-blue-500', B: 'bg-green-500', C: 'bg-yellow-500', D: 'bg-red-500',
    E: 'bg-purple-500', F: 'bg-orange-500', G: 'bg-cyan-500', H: 'bg-pink-500',
    I: 'bg-indigo-500', J: 'bg-teal-500'
  }

  return (
    <Layout title="PSV Routes - Kenya Overwatch">
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 to-green-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Bus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">PSV Routes & Public Transport</h1>
                <p className="text-green-200">Matatu Routes, SACCOs, and CBD Stages</p>
              </div>
            </div>
            <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg"><Route className="w-5 h-5 text-blue-400" /></div>
                  <div>
                    <p className="text-gray-400 text-sm">Routes</p>
                    <p className="text-2xl font-bold text-white">{summary?.total_routes || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg"><MapPin className="w-5 h-5 text-yellow-400" /></div>
                  <div>
                    <p className="text-gray-400 text-sm">CBD Stages</p>
                    <p className="text-2xl font-bold text-white">{summary?.total_stages || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg"><Users className="w-5 h-5 text-green-400" /></div>
                  <div>
                    <p className="text-gray-400 text-sm">SACCOs</p>
                    <p className="text-2xl font-bold text-white">{summary?.total_saccos || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
                  <div>
                    <p className="text-gray-400 text-sm">Hotspots</p>
                    <p className="text-2xl font-bold text-white">{summary?.crash_hotspots || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg"><Zap className="w-5 h-5 text-purple-400" /></div>
                  <div>
                    <p className="text-gray-400 text-sm">Electric</p>
                    <p className="text-2xl font-bold text-white">{summary?.electric_saccos || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Distribution */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" /> Routes by Corridor Line
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary?.lines && Object.entries(summary.lines).map(([line, count]) => (
                  <button
                    key={line}
                    onClick={() => setSelectedLine(selectedLine === line ? 'all' : line)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedLine === line ? `${lineColors[line] || 'bg-gray-600'} text-white` : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Line {line} ({count})
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-700 pb-2">
              {(['routes', 'stages', 'saccos', 'hotspots'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                    activeTab === tab ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tab} ({tab === 'routes' ? filteredRoutes.length : tab === 'stages' ? stages.length : tab === 'saccos' ? saccos.length : hotspots.length})
                </button>
              ))}
            </div>

            {/* Search */}
            {activeTab === 'routes' && (
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search routes by destination, corridor, or stage..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchRoutes()}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
                <button onClick={searchRoutes} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Search</button>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="all">All Stages</option>
                  {stages.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            )}

            {/* Content */}
            {activeTab === 'routes' && (
              <div className="space-y-2">
                {filteredRoutes.map(route => (
                  <div
                    key={route.route_id}
                    className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedRoute(expandedRoute === route.route_id ? null : route.route_id)}
                      className="p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-2 rounded-lg ${lineColors[route.line] || 'bg-gray-600'} text-white font-bold text-lg min-w-[60px] text-center`}>
                            {route.route_number}
                          </div>
                          <div>
                            <p className="text-white font-medium">{route.destination}</p>
                            <p className="text-gray-400 text-sm">{route.corridor} • {route.cbd_stage}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-green-400 font-medium">KSh {route.fare_min_ksh}-{route.fare_max_ksh}</span>
                          <span className="text-gray-400 text-sm">{route.distance_km}km</span>
                          {expandedRoute === route.route_id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                      </div>
                    </div>
                    {expandedRoute === route.route_id && (
                      <div className="px-4 pb-4 border-t border-gray-700 pt-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Key Stages</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {route.key_stages.map((stage, i) => (
                                <span key={i} className="px-2 py-0.5 bg-gray-700 rounded text-gray-300 text-xs">{stage}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-400">Vehicle Type</p>
                            <p className="text-white mt-1 capitalize">{route.vehicle_type.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Line</p>
                            <p className="text-white mt-1">Line {route.line}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Est. Time</p>
                            <p className="text-white mt-1">{Math.round(route.distance_km / 0.5)} min</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'stages' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stages.map(stage => (
                  <div key={stage.name} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg"><MapPin className="w-5 h-5 text-yellow-400" /></div>
                      <div>
                        <h3 className="text-white font-semibold">{stage.name}</h3>
                        <p className="text-gray-400 text-sm">{stage.location}</p>
                      </div>
                    </div>
                    <div className="text-sm space-y-2">
                      <div>
                        <p className="text-gray-400">Directions Served</p>
                        <p className="text-white">{stage.directions.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Routes ({stage.route_count})</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {stage.routes.slice(0, 8).map((r, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-700 rounded text-gray-300 text-xs">{r}</span>
                          ))}
                          {stage.routes.length > 8 && <span className="text-gray-500 text-xs">+{stage.routes.length - 8} more</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'saccos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {saccos.map(sacco => (
                  <div key={sacco.sacco_id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${sacco.is_electric ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                          {sacco.is_electric ? <Zap className="w-5 h-5 text-green-400" /> : <Bus className="w-5 h-5 text-blue-400" />}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{sacco.name}</h3>
                          <p className="text-gray-400 text-xs">{sacco.full_name}</p>
                        </div>
                      </div>
                      {sacco.is_electric && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Electric</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Corridor</p>
                        <p className="text-white">{sacco.primary_corridor}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Fleet</p>
                        <p className="text-white">~{sacco.fleet_estimate} vehicles</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Routes</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sacco.routes.map((r, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-700 rounded text-gray-300 text-xs">{r}</span>
                          ))}
                        </div>
                      </div>
                      {sacco.famous_vehicles.length > 0 && (
                        <div>
                          <p className="text-gray-400">Famous Vehicles</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sacco.famous_vehicles.map((v, i) => (
                              <span key={i} className="px-2 py-0.5 bg-purple-500/20 rounded text-purple-300 text-xs">{v}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'hotspots' && (
              <div className="space-y-3">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" /> Crash Hotspots on PSV Routes
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">High-risk locations on major matatu routes based on crash data analysis</p>
                </div>
                {hotspots.map((hotspot, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(hotspot.severity)}`}>
                          {hotspot.severity.toUpperCase()}
                        </span>
                        <span className="text-white font-medium">Route {hotspot.route}</span>
                      </div>
                      <span className="text-red-400 font-bold">{hotspot.crashes_2024} crashes</span>
                    </div>
                    <p className="text-gray-300 mb-2">{hotspot.location}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-400">Primary cause: <span className="text-yellow-400">{hotspot.cause_primary.replace('_', ' ')}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
