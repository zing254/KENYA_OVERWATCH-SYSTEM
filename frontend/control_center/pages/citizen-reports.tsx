'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import { 
  MapPin, Phone, User, Clock, CheckCircle, AlertCircle, X, MessageSquare, Send, 
  RefreshCw, Search, Filter, Eye, PhoneCall, AlertTriangle, Car, Zap, Route,
  Check, XCircle, ChevronRight, Bell
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface CitizenReport {
  id: string
  type: string
  description: string
  location: string
  latitude?: number
  longitude?: number
  first_name: string
  last_name: string
  phone_number: string
  anonymous: boolean
  attachments: string[]
  status: string
  created_at: string
  priority?: string
  assigned_to?: string
  notes?: string
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export default function CitizenReportsPage() {
  const [reports, setReports] = useState<CitizenReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null)
  const [updating, setUpdating] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, dispatched: 0, resolved: 0, rejected: 0 })

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/citizen/reports`)
      if (!res.ok) throw new Error('Failed to fetch reports')
      const data = await res.json()
      const reportsData = data.reports || []
      setReports(reportsData)
      setStats({
        total: reportsData.length,
        pending: reportsData.filter((r: CitizenReport) => r.status === 'pending').length,
        dispatched: reportsData.filter((r: CitizenReport) => r.status === 'dispatched').length,
        resolved: reportsData.filter((r: CitizenReport) => r.status === 'resolved').length,
        rejected: reportsData.filter((r: CitizenReport) => r.status === 'rejected').length,
      })
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      showToast('Failed to load reports', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchReports()
    const interval = setInterval(fetchReports, 15000)
    return () => clearInterval(interval)
  }, [fetchReports])

  const updateStatus = async (reportId: string, newStatus: string) => {
    if (!selectedReport) return
    
    setUpdating(true)
    try {
      const res = await fetch(`${API_URL}/api/citizen/reports/${reportId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!res.ok) throw new Error('Failed to update status')
      
      showToast(`Report ${newStatus} successfully`, 'success')
      fetchReports()
      setSelectedReport(null)
    } catch (error) {
      console.error('Failed to update status:', error)
      showToast('Failed to update status', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const filteredReports = reports.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter
    const matchesSearch = !searchTerm || 
      r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20 border-yellow-600'
      case 'dispatched': return 'text-blue-400 bg-blue-400/20 border-blue-600'
      case 'resolved': return 'text-green-400 bg-green-400/20 border-green-600'
      case 'rejected': return 'text-red-400 bg-red-400/20 border-red-600'
      default: return 'text-gray-400 bg-gray-400/20 border-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accident': return <Car className="w-5 h-5" />
      case 'speeding': return <Zap className="w-5 h-5" />
      case 'hazard': return <AlertTriangle className="w-5 h-5" />
      case 'pothole': return <Route className="w-5 h-5" />
      case 'road_damage': return <Route className="w-5 h-5" />
      default: return <MapPin className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'accident': return 'text-red-400'
      case 'speeding': return 'text-yellow-400'
      case 'hazard': return 'text-orange-400'
      case 'pothole': return 'text-gray-400'
      default: return 'text-blue-400'
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

  return (
    <Layout title="Citizen Reports - KENYA OVERWATCH">
      <div className="space-y-6">
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in ${
                toast.type === 'success' ? 'bg-green-600 text-white' :
                toast.type === 'error' ? 'bg-red-600 text-white' :
                'bg-blue-600 text-white'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
               toast.type === 'error' ? <XCircle className="w-5 h-5" /> :
               <Bell className="w-5 h-5" />}
              {toast.message}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Citizen Reports</h1>
            <p className="text-gray-400">Manage and process citizen-submitted incident reports</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchReports}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <p className="text-gray-400 text-sm">Total</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-yellow-700">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-400" />
              <p className="text-yellow-400 text-sm">Pending</p>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-blue-700">
            <div className="flex items-center gap-2 mb-1">
              <Send className="w-4 h-4 text-blue-400" />
              <p className="text-blue-400 text-sm">Dispatched</p>
            </div>
            <p className="text-3xl font-bold text-blue-400">{stats.dispatched}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-green-700">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-green-400 text-sm">Resolved</p>
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.resolved}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-red-700">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm">Rejected</p>
            </div>
            <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports by location, description, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'dispatched', 'resolved', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'pending' && stats.pending > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">No reports found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map(report => (
              <div 
                key={report.id} 
                className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-blue-500 transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 group"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-700 ${getTypeColor(report.type)}`}>
                      {getTypeIcon(report.type)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold capitalize">{report.type.replace('_', ' ')}</h3>
                      <p className="text-gray-500 text-xs">{report.id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </div>
                
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{report.description}</p>
                
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{report.location}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
                  <span className="flex items-center gap-1">
                    {report.anonymous ? <User className="w-3 h-3" /> : <User className="w-3 h-3 text-green-400" />}
                    {report.anonymous ? 'Anonymous' : `${report.first_name} ${report.last_name}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(report.created_at)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-end text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm">View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
            <div 
              className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800 z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-700 ${getTypeColor(selectedReport.type)}`}>
                    {getTypeIcon(selectedReport.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white capitalize">{selectedReport.type.replace('_', ' ')}</h2>
                    <p className="text-gray-400 text-sm">{selectedReport.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-white p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-gray-400 text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Description
                  </label>
                  <p className="text-white mt-1">{selectedReport.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <label className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" /> Location
                    </label>
                    <p className="text-white">{selectedReport.location}</p>
                    {selectedReport.latitude && (
                      <p className="text-gray-500 text-xs mt-1">
                        {selectedReport.latitude?.toFixed(6)}, {selectedReport.longitude?.toFixed(6)}
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <label className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4" /> Status
                    </label>
                    <span className={`inline-flex px-3 py-1 rounded text-sm font-medium border ${getStatusColor(selectedReport.status)}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                </div>
                
                {!selectedReport.anonymous && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <label className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" /> Reporter
                      </label>
                      <p className="text-white">{selectedReport.first_name} {selectedReport.last_name}</p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <label className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4" /> Phone
                      </label>
                      <a 
                        href={`tel:${selectedReport.phone_number}`} 
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                      >
                        <PhoneCall className="w-4 h-4" />
                        {selectedReport.phone_number}
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <label className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" /> Submitted
                  </label>
                  <p className="text-white">
                    {new Date(selectedReport.created_at).toLocaleString()} ({formatTime(selectedReport.created_at)})
                  </p>
                </div>
                
                {selectedReport.status === 'pending' && (
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <label className="text-gray-400 text-sm mb-3 block">Quick Actions</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => updateStatus(selectedReport.id, 'dispatched')}
                        disabled={updating}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 rounded-lg flex flex-col items-center gap-1 transition-colors"
                      >
                        <Send className="w-5 h-5" />
                        <span className="text-sm">Dispatch</span>
                      </button>
                      <button 
                        onClick={() => updateStatus(selectedReport.id, 'resolved')}
                        disabled={updating}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 rounded-lg flex flex-col items-center gap-1 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">Resolve</span>
                      </button>
                      <button 
                        onClick={() => updateStatus(selectedReport.id, 'rejected')}
                        disabled={updating}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white py-3 rounded-lg flex flex-col items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                        <span className="text-sm">Reject</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedReport.status !== 'pending' && (
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateStatus(selectedReport.id, 'pending')}
                        disabled={updating}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reopen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
