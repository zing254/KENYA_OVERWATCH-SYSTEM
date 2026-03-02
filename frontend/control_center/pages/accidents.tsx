import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { Search, Filter, MapPin, Users, AlertTriangle, Clock, Car, Phone, FileText, Send } from 'lucide-react'

interface Accident {
  id: string
  accident_type: string
  cause: string
  location: string
  road_name: string
  severity: string
  status: string
  casualties: number
  injuries: number
  reported_at: string
  weather: string
  road_conditions: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

const mockAccidents: Accident[] = [
  { id: 'acc_001', accident_type: 'rear_end', cause: 'speeding', location: 'Mombasa Road Junction', road_name: 'Mombasa Road (A109)', severity: 'high', status: 'dispatched', casualties: 0, injuries: 3, reported_at: new Date().toISOString(), weather: 'clear', road_conditions: 'good' },
  { id: 'acc_002', accident_type: 'hit_pedestrian', cause: 'red_light_jumping', location: 'Kenyatta Avenue', road_name: 'Kenyatta Avenue', severity: 'critical', status: 'on_scene', casualties: 1, injuries: 1, reported_at: new Date(Date.now() - 300000).toISOString(), weather: 'clear', road_conditions: 'good' },
  { id: 'acc_003', accident_type: 'head_on', cause: 'reckless_driving', location: 'Thika Superhighway', road_name: 'Thika Superhighway', severity: 'critical', status: 'treatment', casualties: 2, injuries: 4, reported_at: new Date(Date.now() - 600000).toISOString(), weather: 'rain', road_conditions: 'wet' },
  { id: 'acc_004', accident_type: 'side_impact', cause: 'overtaking', location: 'Nakuru-Eldoret Road', road_name: 'Nakuru-Eldoret Road', severity: 'medium', status: 'cleared', casualties: 0, injuries: 2, reported_at: new Date(Date.now() - 900000).toISOString(), weather: 'clear', road_conditions: 'good' },
  { id: 'acc_005', accident_type: 'rollover', cause: 'fatigue', location: 'Nairobi-Garissa Road', road_name: 'Nairobi-Garissa Road', severity: 'high', status: 'investigation', casualties: 1, injuries: 5, reported_at: new Date(Date.now() - 1200000).toISOString(), weather: 'clear', road_conditions: 'damaged' },
]

export default function AccidentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [accidents, setAccidents] = useState<Accident[]>(mockAccidents)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAccidents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/accidents?limit=100`).catch(() => null)
        if (res?.ok) {
          const data = await res.json()
          if (data.accidents && data.accidents.length > 0) {
            setAccidents(data.accidents)
          }
        }
      } catch (error) {
        console.error('Failed to fetch accidents:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAccidents()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dispatched': return 'text-yellow-400'
      case 'on_scene': return 'text-orange-400'
      case 'treatment': return 'text-red-400'
      case 'cleared': return 'text-green-400'
      case 'investigation': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const filteredAccidents = accidents.filter(a => {
    const matchesSearch = a.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.road_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter
    return matchesSearch && matchesSeverity
  })

  const activeAccidents = accidents.filter(a => !['cleared', 'closed'].includes(a.status)).length
  const totalCasualties = accidents.reduce((sum, a) => sum + (a.casualties || 0), 0)
  const totalInjuries = accidents.reduce((sum, a) => sum + (a.injuries || 0), 0)

  return (
    <Layout title="Accidents - NTSA Road Safety">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Accidents</p>
                <p className="text-3xl font-bold text-white mt-1">{activeAccidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Casualties</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{totalCasualties}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Injuries</p>
                <p className="text-3xl font-bold text-orange-400 mt-1">{totalInjuries}</p>
              </div>
              <Users className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Response</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">8.5 min</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
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
                placeholder="Search by location or road..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-green-500 w-full"
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Accidents List */}
        <div className="space-y-4">
          {filteredAccidents.map((accident) => (
            <div key={accident.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full mt-2 ${getSeverityColor(accident.severity)}`} />
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-semibold">{accident.location}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getSeverityColor(accident.severity)}`}>
                        {accident.severity}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      {accident.accident_type.replace('_', ' ')} - {accident.cause.replace('_', ' ')}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {accident.road_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(accident.reported_at).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {accident.injuries} injured
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {accident.casualties} killed
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Weather: {accident.weather}</span>
                      <span>Road: {accident.road_conditions}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${getStatusColor(accident.status)}`}>
                    {accident.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                  <Send className="w-4 h-4" />
                  Dispatch
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">
                  <Phone className="w-4 h-4" />
                  Contact
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">
                  <FileText className="w-4 h-4" />
                  Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
