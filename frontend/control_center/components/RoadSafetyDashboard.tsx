'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { AlertTriangle, AlertCircle, MapPin, Car, Activity, Shield, FileText, Settings, Radio, Map, BarChart3, Zap, Users, TrendingUp, DollarSign, Clock, MapPinned, Camera, Eye, Bell } from 'lucide-react'

const NTSA_COLORS = {
  primary: '#14532D',
  primaryLight: '#22C55E',
  accent: '#BB0000',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
}

const COLORS = [NTSA_COLORS.danger, NTSA_COLORS.warning, NTSA_COLORS.info, NTSA_COLORS.primaryLight]

interface Accident {
  id: string
  accident_type: string
  cause: string
  location: string
  road_name: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: string
  casualties: number
  injuries: number
  reported_at: string
}

interface Violation {
  id: string
  violation_type: string
  plate_number: string
  location: string
  speed_detected: number | null
  speed_limit: number | null
  fine_amount: number
  status: string
  detected_at: string
}

interface RoadStats {
  name: string
  category: string
  limit: number
  accidents_30d: number
  risk_level: string
}

interface Hotspot {
  name: string
  lat: number
  lng: number
  risk_score: number
  incidents_2024: number
}

const mockAccidents: Accident[] = [
  { id: 'acc_001', accident_type: 'rear_end', cause: 'speeding', location: 'Mombasa Road Junction', road_name: 'Mombasa Road (A109)', severity: 'high', status: 'dispatched', casualties: 0, injuries: 3, reported_at: new Date().toISOString() },
  { id: 'acc_002', accident_type: 'hit_pedestrian', cause: 'red_light_jumping', location: 'Kenyatta Avenue', road_name: 'Kenyatta Avenue', severity: 'critical', status: 'on_scene', casualties: 1, injuries: 1, reported_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'acc_003', accident_type: 'head_on', cause: 'reckless_driving', location: 'Thika Superhighway', road_name: 'Thika Superhighway', severity: 'critical', status: 'treatment', casualties: 2, injuries: 4, reported_at: new Date(Date.now() - 600000).toISOString() },
  { id: 'acc_004', accident_type: 'side_impact', cause: 'overtaking', location: 'Nakuru-Eldoret Road', road_name: 'Nakuru-Eldoret Road', severity: 'medium', status: 'cleared', casualties: 0, injuries: 2, reported_at: new Date(Date.now() - 900000).toISOString() },
]

const mockViolations: Violation[] = [
  { id: 'viol_001', violation_type: 'speeding', plate_number: 'KAA001A', location: 'Mombasa Road', speed_detected: 120, speed_limit: 100, fine_amount: 13000, status: 'detected', detected_at: new Date().toISOString() },
  { id: 'viol_002', violation_type: 'drunk_driving', plate_number: 'KBB002B', location: 'Nairobi Expressway', speed_detected: null, speed_limit: null, fine_amount: 75000, status: 'issued', detected_at: new Date(Date.now() - 180000).toISOString() },
  { id: 'viol_003', violation_type: 'red_light_jumping', plate_number: 'KCC003C', location: 'Kenyatta Ave', speed_detected: null, speed_limit: null, fine_amount: 5000, status: 'detected', detected_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'viol_004', violation_type: 'using_phone', plate_number: 'KDD004D', location: 'Ngong Road', speed_detected: null, speed_limit: null, fine_amount: 3000, status: 'paid', detected_at: new Date(Date.now() - 600000).toISOString() },
]

const mockRoads: RoadStats[] = [
  { name: 'Mombasa Road (A109)', category: 'highway', limit: 100, accidents_30d: 45, risk_level: 'high' },
  { name: 'Nairobi Expressway', category: 'highway', limit: 80, accidents_30d: 28, risk_level: 'medium' },
  { name: 'Thika Superhighway', category: 'highway', limit: 80, accidents_30d: 52, risk_level: 'high' },
  { name: 'Kenyatta Avenue', category: 'urban', limit: 50, accidents_30d: 18, risk_level: 'medium' },
  { name: 'Nakuru-Eldoret Road', category: 'highway', limit: 100, accidents_30d: 34, risk_level: 'medium' },
]

const mockHotspots: Hotspot[] = [
  { name: 'Mombasa Road Junction', lat: -1.3300, lng: 36.9800, risk_score: 0.85, incidents_2024: 156 },
  { name: 'Nairobi CBD Roundabout', lat: -1.2864, lng: 36.8232, risk_score: 0.78, incidents_2024: 203 },
  { name: 'Thika Road', lat: -1.0800, lng: 37.1000, risk_score: 0.82, incidents_2024: 178 },
  { name: 'Nakuru Town', lat: -0.3031, lng: 36.0800, risk_score: 0.65, incidents_2024: 98 },
]

const mockTrendData = [
  { hour: '00:00', accidents: 2, violations: 5 },
  { hour: '04:00', accidents: 1, violations: 2 },
  { hour: '08:00', accidents: 8, violations: 15 },
  { hour: '12:00', accidents: 12, violations: 25 },
  { hour: '16:00', accidents: 15, violations: 32 },
  { hour: '20:00', accidents: 9, violations: 18 },
  { hour: '24:00', accidents: 3, violations: 8 },
]

const severityData = [
  { name: 'Critical', value: 12, color: '#ef4444' },
  { name: 'High', value: 28, color: '#f97316' },
  { name: 'Medium', value: 45, color: '#eab308' },
  { name: 'Low', value: 67, color: '#22c55e' },
]

const causeData = [
  { name: 'Speeding', value: 85 },
  { name: 'Drunk Driving', value: 42 },
  { name: 'Reckless', value: 38 },
  { name: 'Red Light', value: 28 },
  { name: 'Overtaking', value: 22 },
  { name: 'Other', value: 35 },
]

export default function RoadSafetyDashboard() {
  const [accidents, setAccidents] = useState<Accident[]>(mockAccidents)
  const [violations, setViolations] = useState<Violation[]>(mockViolations)
  const [roads] = useState<RoadStats[]>(mockRoads)
  const [hotspots] = useState<Hotspot[]>(mockHotspots)
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({
    todayAccidents: 0,
    todayViolations: 0,
    casualties: 0,
    avgResponseTime: 0,
    revenue: 0,
    activeUnits: 0
  })
  const [loading, setLoading] = useState(true)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, summaryRes] = await Promise.all([
          fetch(`${API_URL}/api/dashboard/stats`).catch(() => null),
          fetch(`${API_URL}/api/dashboard/summary`).catch(() => null)
        ])
        
        if (statsRes?.ok) {
          const statsData = await statsRes.json()
          setStats({
            todayAccidents: statsData.today_accidents || 0,
            todayViolations: statsData.today_violations || 0,
            casualties: statsData.today_casualties || 0,
            avgResponseTime: statsData.avg_response_time || 0,
            revenue: statsData.total_fines_collected || 0,
            activeUnits: statsData.active_teams || 0
          })
        }
        
        if (summaryRes?.ok) {
          const summary = await summaryRes.json()
          if (summary.recent_accidents) setAccidents(summary.recent_accidents)
          if (summary.recent_violations) setViolations(summary.recent_violations)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [API_URL])

  useEffect(() => {
    let ws: WebSocket | null = null
    
    const connectWebSocket = () => {
      try {
        const wsUrl = `ws://${API_URL.replace('http://', '').replace('https://', '')}/ws/road_safety`
        ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log('Road Safety WebSocket connected')
          ws?.send(JSON.stringify({ type: 'subscribe', channels: ['accidents', 'violations'] }))
        }
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'new_accident') {
              setAccidents(prev => [data.accident, ...prev])
            } else if (data.type === 'new_violation') {
              setViolations(prev => [data.violation, ...prev])
            } else if (data.type === 'stats_update') {
              setStats(prev => ({ ...prev, ...data.data }))
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
        
        ws.onclose = () => {
          setTimeout(connectWebSocket, 5000)
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error)
      }
    }
    
    connectWebSocket()
    
    return () => {
      if (ws) ws.close()
    }
  }, [API_URL])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dispatched': return 'text-yellow-400'
      case 'on_scene': return 'text-orange-400'
      case 'treatment': return 'text-red-400'
      case 'cleared': return 'text-green-400'
      case 'detected': return 'text-yellow-400'
      case 'issued': return 'text-blue-400'
      case 'paid': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--'
    return date.toLocaleTimeString('en-KE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      timeZone: 'Africa/Nairobi'
    })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '...'
    return date.toLocaleDateString('en-KE', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'Africa/Nairobi'
    })
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid - NTSA Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/30 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Accidents Today</p>
              <p className="text-3xl font-bold text-white mt-1">{mockAccidents.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-red-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
            <span className="text-gray-500 ml-2">vs yesterday</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-amber-500/30 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Violations Today</p>
              <p className="text-3xl font-bold text-white mt-1">{mockViolations.length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> -5%
            </span>
            <span className="text-gray-500 ml-2">vs yesterday</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-green-500/30 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Active Units</p>
              <p className="text-3xl font-bold text-green-400 mt-1">24</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-blue-500/30 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Avg Response Time</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">8.5 min</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Safety Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200/70 text-sm font-medium">Revenue Today</p>
              <p className="text-2xl font-bold text-green-400 mt-1">KES 2.4M</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200/70 text-sm font-medium">Casualties Today</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {mockAccidents.reduce((sum, a) => sum + a.casualties, 0)}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-200/70 text-sm font-medium">Roads at High Risk</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">3</p>
            </div>
            <Map className="w-8 h-8 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Incidents Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={mockTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="accidents" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
              <Area type="monotone" dataKey="violations" stackId="2" stroke="#F97316" fill="#F97316" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">By Severity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Causes */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Top Accident Causes</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={causeData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9CA3AF" />
            <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Accidents</h3>
          <div className="space-y-3">
            {accidents.slice(0, 4).map(accident => (
              <div key={accident.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getSeverityColor(accident.severity)}`} />
                  <div>
                    <p className="text-white font-medium">{accident.location}</p>
                    <p className="text-gray-400 text-sm">{accident.accident_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${getStatusColor(accident.status)}`}>{accident.status}</p>
                  <p className="text-gray-500 text-xs">{new Date(accident.reported_at).toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Violations</h3>
          <div className="space-y-3">
            {violations.slice(0, 4).map(violation => (
              <div key={violation.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <div>
                    <p className="text-white font-medium">{violation.plate_number}</p>
                    <p className="text-gray-400 text-sm">{violation.violation_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-400">KES {violation.fine_amount.toLocaleString()}</p>
                  <p className="text-gray-500 text-xs">{getStatusColor(violation.status)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderAccidents = () => (
    <div className="space-y-4">
      {accidents.map(accident => (
        <div key={accident.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-2 ${getSeverityColor(accident.severity)}`} />
              <div>
                <h4 className="text-white font-semibold">{accident.location}</h4>
                <p className="text-gray-400 text-sm mt-1">{accident.accident_type.replace('_', ' ')} - {accident.cause.replace('_', ' ')}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {accident.road_name}</span>
                  <span>{new Date(accident.reported_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(accident.severity)} text-white`}>
              {accident.severity}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700 text-sm">
            <div className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-4 h-4" /> {accident.casualties} Casualties
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Users className="w-4 h-4" /> {accident.injuries} Injuries
            </div>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm ml-auto">
              Dispatch
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const renderViolations = () => (
    <div className="space-y-4">
      {violations.map(violation => (
        <div key={violation.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full mt-2 bg-orange-500" />
              <div>
                <h4 className="text-white font-semibold">{violation.plate_number}</h4>
                <p className="text-gray-400 text-sm mt-1">{violation.violation_type.replace('_', ' ')}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {violation.location}</span>
                  <span>{new Date(violation.detected_at).toLocaleString()}</span>
                  {violation.speed_detected && (
                    <span className="text-red-400">{violation.speed_detected} km/h (Limit: {violation.speed_limit})</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-yellow-400">KES {violation.fine_amount.toLocaleString()}</p>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(violation.status)} bg-gray-700`}>
                {violation.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
            {violation.status === 'detected' && (
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                Issue Notice
              </button>
            )}
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">
              View Evidence
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">
              Vehicle Details
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const renderRoads = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roads.map(road => (
          <div key={road.name} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-semibold">{road.name}</h4>
                <p className="text-gray-400 text-sm">{road.category} - Speed Limit: {road.limit} km/h</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                road.risk_level === 'high' ? 'bg-red-600' : 
                road.risk_level === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
              } text-white`}>
                {road.risk_level}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> {road.accidents_30d} accidents (30 days)
                </span>
              </div>
              <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderHotspots = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Accident Hotspots</h3>
        <div className="space-y-3">
          {hotspots.map(hotspot => (
            <div key={hotspot.name} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <MapPinned className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white font-medium">{hotspot.name}</p>
                  <p className="text-gray-400 text-sm">Risk Score: {(hotspot.risk_score * 100).toFixed(0)}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-red-400">{hotspot.incidents_2024}</p>
                <p className="text-gray-500 text-xs">incidents in 2024</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue (2024)</p>
              <p className="text-3xl font-bold text-green-400 mt-1">KES 245M</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Points Deducted</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">12,450</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Licenses Suspended</p>
              <p className="text-3xl font-bold text-red-400 mt-1">1,245</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'accidents', label: 'Accidents', icon: AlertTriangle },
    { id: 'violations', label: 'Violations', icon: Car },
    { id: 'roads', label: 'Roads', icon: Map },
    { id: 'hotspots', label: 'Hotspots', icon: MapPin },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* NTSA Header - Official Branding */}
      <header className="bg-gradient-to-r from-ntsa-primaryDark via-ntsa-primary to-ntsa-primaryDark border-b-2 border-ntsa-primaryLight px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-ntsa-primaryLight/20 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-ntsa-primaryLight" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">NTSA Road Safety</h1>
              <p className="text-ntsa-primaryLight/80 text-sm">National Command Center | Kenya Overwatch</p>
            </div>
          </div>
          
          {/* Quick Stats in Header */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-lg">
              <Camera className="w-4 h-4 text-ntsa-primaryLight" />
              <span className="text-sm text-white">156 Cameras</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-lg">
              <Eye className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white">24 Active</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-lg border border-red-500/30">
              <Bell className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400 font-medium">3 Alerts</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              {mounted ? (
                <>
                  <p className="text-white font-medium">{formatDate(currentTime)}</p>
                  <p className="text-ntsa-primaryLight text-xl font-mono">{formatTime(currentTime)}</p>
                </>
              ) : (
                <>
                  <p className="text-white font-medium">Loading...</p>
                  <p className="text-ntsa-primaryLight text-xl font-mono">--:--:--</p>
                </>
              )}
            </div>
            <div className="w-10 h-10 bg-ntsa-primaryLight rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - NTSA Theme */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-ntsa-primaryLight text-ntsa-primaryLight bg-ntsa-primaryDark/30'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'accidents' && renderAccidents()}
        {activeTab === 'violations' && renderViolations()}
        {activeTab === 'roads' && renderRoads()}
        {activeTab === 'hotspots' && renderHotspots()}
        {activeTab === 'analytics' && renderAnalytics()}
      </main>
    </div>
  )
}
