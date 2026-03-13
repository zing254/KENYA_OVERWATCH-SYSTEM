'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { MapPin, Phone, User, Clock, CheckCircle, AlertCircle, X, MessageSquare, Send } from 'lucide-react'

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
}

export default function CitizenReportsPage() {
  const [reports, setReports] = useState<CitizenReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null)

  useEffect(() => {
    fetchReports()
    const interval = setInterval(fetchReports, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_URL}/api/citizen/reports`)
      const data = await res.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      await fetch(`${API_URL}/api/citizen/reports/${reportId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      fetchReports()
      setSelectedReport(null)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20'
      case 'dispatched': return 'text-blue-400 bg-blue-400/20'
      case 'resolved': return 'text-green-400 bg-green-400/20'
      case 'rejected': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accident': return '🚗'
      case 'speeding': return '⚡'
      case 'hazard': return '⚠️'
      case 'pothole': return '🕳️'
      default: return '📍'
    }
  }

  return (
    <Layout title="Citizen Reports - KENYA OVERWATCH">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Citizen Reports</h1>
          <div className="flex gap-2">
            {['all', 'pending', 'dispatched', 'resolved'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status 
                    ? 'bg-ntsa-primaryLight text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Reports</p>
            <p className="text-3xl font-bold text-white">{reports.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-yellow-700">
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-400">{reports.filter(r => r.status === 'pending').length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-blue-700">
            <p className="text-gray-400 text-sm">Dispatched</p>
            <p className="text-3xl font-bold text-blue-400">{reports.filter(r => r.status === 'dispatched').length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-green-700">
            <p className="text-gray-400 text-sm">Resolved</p>
            <p className="text-3xl font-bold text-green-400">{reports.filter(r => r.status === 'resolved').length}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No reports found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map(report => (
              <div 
                key={report.id} 
                className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-purple-500 transition-colors cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(report.type)}</span>
                    <div>
                      <h3 className="text-white font-semibold">{report.type.replace('_', ' ')}</h3>
                      <p className="text-gray-400 text-xs">{report.id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </div>
                
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{report.description}</p>
                
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{report.location}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{report.anonymous ? 'Anonymous' : `${report.first_name} ${report.last_name}`}</span>
                  <span>{new Date(report.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getTypeIcon(selectedReport.type)}</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedReport.type.replace('_', ' ')}</h2>
                  <p className="text-gray-400 text-sm">{selectedReport.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Description</label>
                <p className="text-white">{selectedReport.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Location</label>
                  <p className="text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedReport.location}
                  </p>
                  {selectedReport.latitude && (
                    <p className="text-gray-500 text-xs">
                      {selectedReport.latitude}, {selectedReport.longitude}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Status</label>
                  <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>
              
              {!selectedReport.anonymous && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Reporter</label>
                    <p className="text-white flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedReport.first_name} {selectedReport.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Phone</label>
                    <a href={`tel:${selectedReport.phone_number}`} className="text-white flex items-center gap-2 hover:text-ntsa-primaryLight">
                      <Phone className="w-4 h-4" />
                      {selectedReport.phone_number}
                    </a>
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-gray-400 text-sm">Submitted</label>
                <p className="text-white flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {new Date(selectedReport.created_at).toLocaleString()}
                </p>
              </div>
              
              <div className="border-t border-gray-700 pt-4 mt-4">
                <label className="text-gray-400 text-sm mb-2 block">Update Status</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateStatus(selectedReport.id, 'dispatched')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Dispatch
                  </button>
                  <button 
                    onClick={() => updateStatus(selectedReport.id, 'resolved')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolve
                  </button>
                  <button 
                    onClick={() => updateStatus(selectedReport.id, 'rejected')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
