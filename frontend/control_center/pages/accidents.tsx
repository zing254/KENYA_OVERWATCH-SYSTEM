'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import { 
  AlertTriangle, MapPin, Clock, Search, Filter, Download, RefreshCw,
  Car, User, Eye, Phone, MessageSquare, Send, CheckCircle, XCircle, ChevronRight,
  Calendar, Activity, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface Incident {
  incident_id: string
  incident_type: string
  title: string
  description: string
  location: string
  latitude?: number
  longitude?: number
  severity: string
  status: string
  casualties?: number
  injuries?: number
  created_at: string
}

export default function AccidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/incidents`)
      const data = await res.json()
      setIncidents(data.incidents || [])
    } catch (error) {
      console.error('Failed to fetch incidents:', error)
      toast.error('Failed to load incidents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIncidents()
    const interval = setInterval(fetchIncidents, 15000)
    return () => clearInterval(interval)
  }, [fetchIncidents])

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true)
    try {
      const res = await fetch(`${API_URL}/api/export/incidents?format=${format}`)
      if (format === 'csv') {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `incidents_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Export completed')
      } else {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `incidents_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Export completed')
      }
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed')
    }
    setExporting(false)
  }

  const updateStatus = async (incidentId: string, newStatus: string) => {
    try {
      await fetch(`${API_URL}/api/incidents/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      toast.success(`Incident ${newStatus}`)
      fetchIncidents()
      setSelectedIncident(null)
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    }
  }

  const filteredIncidents = incidents.filter(inc => {
    const matchesFilter = filter === 'all' || inc.status === filter
    const matchesSearch = !searchTerm || 
      inc.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.incident_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.incident_id?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-400/20 border-red-600'
      case 'high': return 'text-orange-400 bg-orange-400/20 border-orange-600'
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-600'
      default: return 'text-blue-400 bg-blue-400/20 border-blue-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-400'
      case 'investigating': return 'text-yellow-400'
      case 'resolved': return 'text-green-400'
      default: return 'text-gray-400'
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

  const stats = {
    total: incidents.length,
    active: incidents.filter(i => i.status === 'active').length,
    investigating: incidents.filter(i => i.status === 'investigating').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
  }

  return (
    <Layout title="Incidents - KENYA OVERWATCH">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Incidents</h1>
            <p className="text-gray-400">Monitor and manage road incidents</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={fetchIncidents}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-gray-400" />
              <p className="text-gray-400 text-sm">Total</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-red-700">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm">Active</p>
            </div>
            <p className="text-3xl font-bold text-red-400">{stats.active}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-yellow-700">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-yellow-400" />
              <p className="text-yellow-400 text-sm">Investigating</p>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{stats.investigating}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-green-700">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-green-400 text-sm">Resolved</p>
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'active', 'investigating', 'resolved'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Incidents Grid */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">Loading incidents...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">No incidents found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIncidents.map(incident => (
              <div 
                key={incident.incident_id}
                className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-blue-500 transition-all cursor-pointer hover:shadow-lg"
                onClick={() => setSelectedIncident(incident)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold capitalize">{incident.incident_type?.replace('_', ' ') || 'Incident'}</h3>
                    <p className="text-gray-500 text-xs">{incident.incident_id}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </div>
                
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{incident.description}</p>
                
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{incident.location}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
                  <span className={getStatusColor(incident.status)}>{incident.status}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(incident.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedIncident && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedIncident(null)}>
            <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
                <div>
                  <h2 className="text-xl font-bold text-white capitalize">{selectedIncident.incident_type?.replace('_', ' ')}</h2>
                  <p className="text-gray-400 text-sm">{selectedIncident.incident_id}</p>
                </div>
                <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-white p-2">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Description</label>
                  <p className="text-white mt-1">{selectedIncident.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <label className="text-gray-400 text-sm">Severity</label>
                    <span className={`inline-flex px-3 py-1 rounded text-sm font-medium border mt-1 ${getSeverityColor(selectedIncident.severity)}`}>
                      {selectedIncident.severity}
                    </span>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <label className="text-gray-400 text-sm">Status</label>
                    <p className={`text-white mt-1 ${getStatusColor(selectedIncident.status)}`}>{selectedIncident.status}</p>
                  </div>
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <label className="text-gray-400 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Location
                  </label>
                  <p className="text-white mt-1">{selectedIncident.location}</p>
                  {selectedIncident.latitude && (
                    <p className="text-gray-500 text-xs mt-1">
                      {selectedIncident.latitude?.toFixed(6)}, {selectedIncident.longitude?.toFixed(6)}
                    </p>
                  )}
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <label className="text-gray-400 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Reported
                  </label>
                  <p className="text-white mt-1">{new Date(selectedIncident.created_at).toLocaleString()}</p>
                </div>
                
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <label className="text-gray-400 text-sm mb-3 block">Actions</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => updateStatus(selectedIncident.incident_id, 'investigating')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg flex flex-col items-center gap-1"
                    >
                      <Activity className="w-5 h-5" />
                      <span className="text-sm">Investigate</span>
                    </button>
                    <button 
                      onClick={() => updateStatus(selectedIncident.incident_id, 'resolved')}
                      className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex flex-col items-center gap-1"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Resolve</span>
                    </button>
                    <button 
                      onClick={() => updateStatus(selectedIncident.incident_id, 'dispatched')}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex flex-col items-center gap-1"
                    >
                      <Send className="w-5 h-5" />
                      <span className="text-sm">Dispatch</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
