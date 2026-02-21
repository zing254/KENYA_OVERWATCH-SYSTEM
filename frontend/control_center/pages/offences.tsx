'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Car, Search, Filter, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Offence {
  id: string
  offence_type: string
  plate_number: string
  location: string
  status: string
  fine_amount: number
  detected_at: string
}

export default function OffencesPage() {
  const [offences, setOffences] = useState<Offence[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/offences/new`)
      const data = await res.json()
      setOffences(Array.isArray(data) ? data : data.offences || [])
    } catch (error) {
      console.error('Error fetching offences:', error)
      setOffences([
        { id: 'off_001', offence_type: 'speeding', plate_number: 'KAA 001A', location: 'Kenyatta Avenue', status: 'detected', fine_amount: 5000, detected_at: new Date().toISOString() },
        { id: 'off_002', offence_type: 'red_light', plate_number: 'KAB 123C', location: 'Westlands Roundabout', status: 'issued', fine_amount: 5000, detected_at: new Date().toISOString() },
        { id: 'off_003', offence_type: 'illegal_parking', plate_number: 'KCD 456D', location: 'CBD', status: 'paid', fine_amount: 2000, detected_at: new Date().toISOString() },
      ])
    }
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'bg-yellow-600'
      case 'issued': return 'bg-blue-600'
      case 'paid': return 'bg-green-600'
      case 'disputed': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const filtered = offences.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter
    const matchesSearch = !search || o.plate_number.toLowerCase().includes(search.toLowerCase()) || o.location.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <Layout title="Kenya Overwatch - Traffic Offences">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Traffic Offences</h1>
            <p className="text-gray-400">Manage traffic violations and fines</p>
          </div>

        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by plate or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Status</option>
            <option value="detected">Detected</option>
            <option value="issued">Issued</option>
            <option value="paid">Paid</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <AlertTriangle className="w-4 h-4" /> Detected
            </div>
            <p className="text-2xl font-bold text-yellow-400">{offences.filter(o => o.status === 'detected').length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Car className="w-4 h-4" /> Issued
            </div>
            <p className="text-2xl font-bold text-blue-400">{offences.filter(o => o.status === 'issued').length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <CheckCircle className="w-4 h-4" /> Paid
            </div>
            <p className="text-2xl font-bold text-green-400">{offences.filter(o => o.status === 'paid').length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <XCircle className="w-4 h-4" /> Disputed
            </div>
            <p className="text-2xl font-bold text-red-400">{offences.filter(o => o.status === 'disputed').length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left text-gray-400 p-4">Plate</th>
                <th className="text-left text-gray-400 p-4">Type</th>
                <th className="text-left text-gray-400 p-4">Location</th>
                <th className="text-left text-gray-400 p-4">Fine</th>
                <th className="text-left text-gray-400 p-4">Status</th>
                <th className="text-left text-gray-400 p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(offence => (
                <tr key={offence.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4 text-white font-mono">{offence.plate_number}</td>
                  <td className="p-4 text-gray-300 capitalize">{offence.offence_type.replace('_', ' ')}</td>
                  <td className="p-4 text-gray-300">{offence.location}</td>
                  <td className="p-4 text-white">KES {offence.fine_amount.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(offence.status)}`}>
                      {offence.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(offence.detected_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No offences found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
