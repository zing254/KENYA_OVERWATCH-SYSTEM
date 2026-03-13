import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { Search, Filter, Download, Eye, Check, X, Car, MapPin, Clock, AlertTriangle, DollarSign, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Violation {
  id: string
  violation_type: string
  plate_number: string
  vehicle_type: string
  location: string
  road_name: string
  speed_detected: number | null
  speed_limit: number | null
  fine_amount: number
  penalty_points: number
  status: string
  detected_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

const mockViolations: Violation[] = [
  { id: 'viol_001', violation_type: 'speeding', plate_number: 'KAA001A', vehicle_type: 'saloon', location: 'Mombasa Road Junction', road_name: 'Mombasa Road (A109)', speed_detected: 120, speed_limit: 100, fine_amount: 13000, penalty_points: 3, status: 'detected', detected_at: new Date().toISOString() },
  { id: 'viol_002', violation_type: 'drunk_driving', plate_number: 'KBB002B', vehicle_type: 'matatu', location: 'Nairobi Expressway', road_name: 'Nairobi Expressway', speed_detected: null, speed_limit: null, fine_amount: 75000, penalty_points: 14, status: 'issued', detected_at: new Date(Date.now() - 180000).toISOString() },
  { id: 'viol_003', violation_type: 'red_light_jumping', plate_number: 'KCC003C', vehicle_type: 'saloon', location: 'Kenyatta Avenue', road_name: 'Kenyatta Avenue', speed_detected: null, speed_limit: null, fine_amount: 5000, penalty_points: 6, status: 'detected', detected_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'viol_004', violation_type: 'using_phone', plate_number: 'KDD004D', vehicle_type: 'pickup', location: 'Ngong Road', road_name: 'Ngong Road', speed_detected: null, speed_limit: null, fine_amount: 3000, penalty_points: 4, status: 'paid', detected_at: new Date(Date.now() - 600000).toISOString() },
  { id: 'viol_005', violation_type: 'overloading', plate_number: 'KEE005E', vehicle_type: 'lorry', location: 'Thika Superhighway', road_name: 'Thika Superhighway', speed_detected: 60, speed_limit: 80, fine_amount: 25000, penalty_points: 6, status: 'issued', detected_at: new Date(Date.now() - 900000).toISOString() },
  { id: 'viol_006', violation_type: 'reckless_driving', plate_number: 'KFF006F', vehicle_type: 'saloon', location: 'Nakuru-Eldoret Road', road_name: 'Nakuru-Eldoret Road', speed_detected: 140, speed_limit: 100, fine_amount: 45000, penalty_points: 12, status: 'disputed', detected_at: new Date(Date.now() - 1200000).toISOString() },
]

export default function ViolationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [violations, setViolations] = useState<Violation[]>(mockViolations)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleExport = async () => {
    toast.loading('Exporting violations data...')
    await new Promise(r => setTimeout(r, 1500))
    toast.success('Exported 6 records to CSV')
  }

  const handleViewDetails = (violationId: string) => {
    toast.success('Opening violation details...')
  }

  const handleIssueNotice = async (violationId: string) => {
    setActionLoading(violationId)
    await new Promise(r => setTimeout(r, 1000))
    setViolations(prev => prev.map(v => v.id === violationId ? { ...v, status: 'issued' } : v))
    toast.success('Notice issued successfully')
    setActionLoading(null)
  }

  const handleMarkPaid = async (violationId: string) => {
    setActionLoading(violationId)
    await new Promise(r => setTimeout(r, 1000))
    setViolations(prev => prev.map(v => v.id === violationId ? { ...v, status: 'paid' } : v))
    toast.success('Payment recorded successfully')
    setActionLoading(null)
  }

  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const res = await fetch(`${API_URL}/api/violations?limit=100`).catch(() => null)
        if (res?.ok) {
          const data = await res.json()
          if (data.violations && data.violations.length > 0) {
            setViolations(data.violations)
          }
        }
      } catch (error) {
        console.error('Failed to fetch violations:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchViolations()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'bg-yellow-600'
      case 'issued': return 'bg-blue-600'
      case 'paid': return 'bg-green-600'
      case 'disputed': return 'bg-purple-600'
      case 'cancelled': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const filteredViolations = violations.filter(v => {
    const matchesSearch = v.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalFines = mockViolations.reduce((sum, v) => sum + v.fine_amount, 0)
  const paidFines = mockViolations.filter(v => v.status === 'paid').reduce((sum, v) => sum + v.fine_amount, 0)

  return (
    <Layout title="Traffic Violations - KENYA OVERWATCH">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Violations</p>
                <p className="text-3xl font-bold text-white mt-1">{mockViolations.length}</p>
              </div>
              <Car className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Fines</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">KES {totalFines.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Collected</p>
                <p className="text-3xl font-bold text-green-400 mt-1">KES {paidFines.toLocaleString()}</p>
              </div>
              <Check className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-3xl font-bold text-orange-400 mt-1">{mockViolations.filter(v => v.status !== 'paid').length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by plate number or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-green-500 w-full"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="detected">Detected</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="disputed">Disputed</option>
            </select>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Violations Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Plate Number</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Violation</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Location</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Speed</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Fine</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Points</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredViolations.map((violation) => (
                <tr key={violation.id} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{violation.plate_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-orange-400 capitalize">{violation.violation_type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-300">
                      <MapPin className="w-3 h-3" />
                      {violation.location}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {violation.speed_detected ? (
                      <span className="text-red-400">{violation.speed_detected} km/h <span className="text-gray-500">/ {violation.speed_limit}</span></span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-yellow-400 font-medium">KES {violation.fine_amount.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-blue-400">{violation.penalty_points} pts</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(violation.status)}`}>
                      {violation.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {new Date(violation.detected_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewDetails(violation.id)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors" 
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      {violation.status === 'detected' && (
                        <button 
                          onClick={() => handleIssueNotice(violation.id)}
                          disabled={actionLoading === violation.id}
                          className="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-50" 
                          title="Issue Notice"
                        >
                          {actionLoading === violation.id ? (
                            <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 text-green-400" />
                          )}
                        </button>
                      )}
                      {violation.status === 'issued' && (
                        <button 
                          onClick={() => handleMarkPaid(violation.id)}
                          disabled={actionLoading === violation.id}
                          className="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-50" 
                          title="Mark as Paid"
                        >
                          {actionLoading === violation.id ? (
                            <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                          ) : (
                            <DollarSign className="w-4 h-4 text-yellow-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
