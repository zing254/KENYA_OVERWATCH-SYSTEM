'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { AlertTriangle, MapPin, Clock, Eye, CheckCircle, XCircle, Filter, User, MessageCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Incident {
  id: string
  type: string
  title: string
  description: string
  location: string
  coordinates: { lat: number; lng: number }
  severity: string
  status: string
  risk_score: number
  created_at: string
  source?: string
  ai_analysis?: any
  attachments?: string[]
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [citizenReports, setCitizenReports] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchIncidents()
    fetchCitizenReports()
  }, [])

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/incidents`)
      const data = await res.json()
      const systemIncidents = (Array.isArray(data) ? data : []).map((i: any) => ({...i, source: 'system'}))
      setIncidents(systemIncidents)
    } catch (error) {
      console.error('Error fetching incidents:', error)
      setIncidents([
        { id: 'inc_001', type: 'suspicious_activity', title: 'Suspicious Person', description: 'Unidentified individual', location: 'Nairobi CBD', coordinates: { lat: -1.2864, lng: 36.8232 }, severity: 'high', status: 'active', risk_score: 0.75, created_at: new Date().toISOString(), source: 'system' },
        { id: 'inc_002', type: 'theft', title: 'Theft Attempt', description: 'Shoplifting reported', location: 'Westlands', coordinates: { lat: -1.2644, lng: 36.8019 }, severity: 'medium', status: 'responding', risk_score: 0.65, created_at: new Date(Date.now() - 300000).toISOString(), source: 'system' },
      ])
    }
    setLoading(false)
  }

  const fetchCitizenReports = async () => {
    try {
      const res = await fetch(`${API_URL}/api/citizen/reports`)
      const data = await res.json()
      const reports = (data.reports || []).map((r: any) => ({
        id: r.id,
        type: r.type,
        title: `${r.type.charAt(0).toUpperCase() + r.type.slice(1).replace('_', ' ')} Reported`,
        description: r.description,
        location: r.location,
        coordinates: r.coordinates || { lat: r.latitude || -1.2921, lng: r.longitude || 36.8219 },
        severity: r.priority || 'medium',
        status: r.status,
        risk_score: r.ai_analysis?.severity_score || 0.5,
        created_at: r.created_at,
        source: 'citizen',
        ai_analysis: r.ai_analysis,
        attachments: r.attachments,
        reported_by: r.anonymous ? 'Anonymous' : `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        phone: r.phone_number
      }))
      setCitizenReports(reports)
    } catch (error) {
      console.error('Error fetching citizen reports:', error)
    }
  }

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
      case 'active': return 'text-red-400'
      case 'responding': return 'text-yellow-400'
      case 'resolved': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const filteredIncidents = filter === 'all' ? incidents : incidents.filter(i => i.status === filter)
  const filteredReports = filter === 'all' ? citizenReports : citizenReports.filter(i => i.status === filter)
  
  const allItems = activeTab === 'all' 
    ? [...filteredIncidents, ...filteredReports]
    : activeTab === 'system' 
      ? filteredIncidents 
      : filteredReports

  return (
    <Layout title="Incidents - Kenya Overwatch">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Incidents</h1>
            <p className="text-gray-400">Manage and monitor all incidents</p>
          </div>
        </div>
        
        <div className="flex gap-4 border-b border-gray-700">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 -mb-px border-b-2 ${activeTab === 'all' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400'}`}
          >
            All ({incidents.length + citizenReports.length})
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 -mb-px border-b-2 ${activeTab === 'system' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400'}`}
          >
            System ({incidents.length})
          </button>
          <button 
            onClick={() => setActiveTab('citizen')}
            className={`px-4 py-2 -mb-px border-b-2 ${activeTab === 'citizen' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400'}`}
          >
            Citizen Reports ({citizenReports.length})
          </button>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-700'} text-white text-sm`}>All</button>
          <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-lg ${filter === 'active' ? 'bg-blue-600' : 'bg-gray-700'} text-white text-sm`}>Active</button>
          <button onClick={() => setFilter('responding')} className={`px-4 py-2 rounded-lg ${filter === 'responding' ? 'bg-blue-600' : 'bg-gray-700'} text-white text-sm`}>Responding</button>
          <button onClick={() => setFilter('resolved')} className={`px-4 py-2 rounded-lg ${filter === 'resolved' ? 'bg-blue-600' : 'bg-gray-700'} text-white text-sm`}>Resolved</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {allItems.map(incident => (
              <div key={incident.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(incident.severity)}`}></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{incident.title}</h3>
                        {incident.source === 'citizen' && (
                          <span className="px-2 py-0.5 bg-green-900 text-green-400 text-xs rounded-full flex items-center gap-1">
                            <User className="w-3 h-3" /> Citizen
                          </span>
                        )}
                        {incident.attachments && incident.attachments.length > 0 && (
                          <span className="px-2 py-0.5 bg-purple-900 text-purple-400 text-xs rounded-full flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {incident.attachments.length} attachments
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{incident.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{incident.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(incident.created_at).toLocaleString()}</span>
                      </div>
                      {incident.source === 'citizen' && (incident as any).reported_by && (
                        <p className="text-gray-500 text-xs mt-1">Reported by: {(incident as any).reported_by}</p>
                      )}
                      {incident.ai_analysis && (
                        <div className="mt-2 p-2 bg-blue-900/30 rounded text-xs">
                          <span className="text-blue-400 font-medium">AI Analysis: </span>
                          <span className="text-blue-300">{incident.ai_analysis.recommendation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${getStatusColor(incident.status)}`}>{incident.status}</span>
                    <p className="text-gray-500 text-xs mt-1">Risk: {((incident.risk_score || 0) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
