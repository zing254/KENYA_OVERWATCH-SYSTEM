import Layout from '@/components/Layout'
import { Map, TrendingUp, AlertTriangle, Car, Clock, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Road {
  name: string
  category: string
  limit: number
  accidents_30d: number
  risk_level: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

const mockRoads: Road[] = [
  { name: 'Mombasa Road (A109)', category: 'highway', limit: 100, accidents_30d: 45, risk_level: 'high' },
  { name: 'Nairobi Expressway', category: 'highway', limit: 80, accidents_30d: 28, risk_level: 'medium' },
  { name: 'Thika Superhighway', category: 'highway', limit: 80, accidents_30d: 52, risk_level: 'high' },
  { name: 'Kenyatta Avenue', category: 'urban', limit: 50, accidents_30d: 18, risk_level: 'medium' },
  { name: 'Ngong Road', category: 'arterial', limit: 60, accidents_30d: 22, risk_level: 'medium' },
  { name: 'University Way', category: 'urban', limit: 50, accidents_30d: 15, risk_level: 'low' },
  { name: 'Nakuru-Eldoret Road', category: 'highway', limit: 100, accidents_30d: 34, risk_level: 'medium' },
  { name: 'Thika Road', category: 'arterial', limit: 80, accidents_30d: 38, risk_level: 'high' },
]

export default function RoadsPage() {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/30'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/30'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'highway': return 'bg-blue-600'
      case 'arterial': return 'bg-purple-600'
      case 'urban': return 'bg-orange-600'
      default: return 'bg-gray-600'
    }
  }

  const [roads, setRoads] = useState<Road[]>(mockRoads)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRoads = async () => {
      try {
        const res = await fetch(`${API_URL}/api/roads`).catch(() => null)
        if (res?.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setRoads(data.map((r: any) => ({
              name: r.name,
              category: r.category,
              limit: r.speed_limit,
              accidents_30d: r.accidents_30d || 0,
              risk_level: r.risk_level
            })))
          }
        }
      } catch (error) {
        console.error('Failed to fetch roads:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRoads()
  }, [])

  const totalAccidents = roads.reduce((sum, r) => sum + r.accidents_30d, 0)
  const highRiskRoads = roads.filter(r => r.risk_level === 'high').length

  return (
    <Layout title="Roads - KENYA OVERWATCH">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Monitored Roads</p>
                <p className="text-3xl font-bold text-white mt-1">{roads.length}</p>
              </div>
              <Map className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">30-Day Accidents</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{totalAccidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">High Risk Roads</p>
                <p className="text-3xl font-bold text-orange-400 mt-1">{highRiskRoads}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Roads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roads.map((road) => (
            <div key={road.name} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-semibold">{road.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getCategoryColor(road.category)}`}>
                      {road.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Car className="w-3 h-3" /> Limit: {road.limit} km/h
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {road.accidents_30d} accidents (30d)
                    </span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(road.risk_level)}`}>
                  {road.risk_level}
                </div>
              </div>
              
              {/* Risk Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Risk Level</span>
                  <span>{road.risk_level === 'high' ? '75%' : road.risk_level === 'medium' ? '50%' : '25%'}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      road.risk_level === 'high' ? 'bg-red-500' : 
                      road.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: road.risk_level === 'high' ? '75%' : road.risk_level === 'medium' ? '50%' : '25%' }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
                <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
                  View Details
                </button>
                <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
                  Speed Cams
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
