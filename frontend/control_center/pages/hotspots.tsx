import Layout from '@/components/Layout'
import { MapPin, AlertTriangle, TrendingUp, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

interface Hotspot {
  name: string
  lat: number
  lng: number
  risk_score: number
  incidents_2024: number
  road_name: string
  category: string
}

const mockHotspots: Hotspot[] = [
  { name: 'Mombasa Road Junction', lat: -1.3300, lng: 36.9800, risk_score: 0.85, incidents_2024: 156, road_name: 'Mombasa Road (A109)', category: 'intersection' },
  { name: 'Nairobi CBD Roundabout', lat: -1.2864, lng: 36.8232, risk_score: 0.78, incidents_2024: 203, road_name: 'Kenyatta Avenue', category: 'roundabout' },
  { name: 'Thika Road', lat: -1.0800, lng: 37.1000, risk_score: 0.82, incidents_2024: 178, road_name: 'Thika Superhighway', category: 'highway' },
  { name: 'Nakuru Town', lat: -0.3031, lng: 36.0800, risk_score: 0.65, incidents_2024: 98, road_name: 'Nakuru-Eldoret Road', category: 'urban' },
  { name: 'Kisumu Roundabout', lat: -0.1022, lng: 34.7617, risk_score: 0.58, incidents_2024: 67, road_name: 'Kisumu Road', category: 'roundabout' },
  { name: 'Mombasa-Malindi Road', lat: -3.2000, lng: 40.1000, risk_score: 0.72, incidents_2024: 89, road_name: 'Mombasa-Malindi Road', category: 'highway' },
  { name: 'Eldoret Town', lat: 0.5143, lng: 35.2698, risk_score: 0.55, incidents_2024: 45, road_name: 'Nakuru-Eldoret Road', category: 'urban' },
  { name: 'Kakamega', lat: 0.2827, lng: 34.7519, risk_score: 0.42, incidents_2024: 32, road_name: 'Kakamega Road', category: 'urban' },
]

export default function HotspotsPage() {
  const getRiskColor = (score: number) => {
    if (score >= 0.75) return 'text-red-400'
    if (score >= 0.5) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getRiskBg = (score: number) => {
    if (score >= 0.75) return 'bg-red-400/10 border-red-400/30'
    if (score >= 0.5) return 'bg-yellow-400/10 border-yellow-400/30'
    return 'bg-green-400/10 border-green-400/30'
  }

  const totalIncidents = mockHotspots.reduce((sum, h) => sum + h.incidents_2024, 0)
  const criticalHotspots = mockHotspots.filter(h => h.risk_score >= 0.75).length

  const handleViewMap = (hotspotName: string) => {
    toast.success(`Opening map for ${hotspotName}...`)
  }

  const handleExportCSV = () => {
    toast.loading('Exporting hotspots data...')
    setTimeout(() => toast.success('Exported to CSV successfully'), 1500)
  }

  return (
    <Layout title="Accident Hotspots - KENYA OVERWATCH">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Identified Hotspots</p>
                <p className="text-3xl font-bold text-white mt-1">{mockHotspots.length}</p>
              </div>
              <MapPin className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Incidents (2024)</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{totalIncidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Critical Zones</p>
                <p className="text-3xl font-bold text-orange-400 mt-1">{criticalHotspots}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Hotspots List */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Hotspot</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Road</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Category</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Risk Score</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Incidents 2024</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Coordinates</th>
                <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {mockHotspots.map((hotspot) => (
                <tr key={hotspot.name} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span className="text-white font-medium">{hotspot.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {hotspot.road_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300 capitalize">
                      {hotspot.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            hotspot.risk_score >= 0.75 ? 'bg-red-500' : 
                            hotspot.risk_score >= 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${hotspot.risk_score * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${getRiskColor(hotspot.risk_score)}`}>
                        {(hotspot.risk_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{hotspot.incidents_2024}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => handleViewMap(hotspot.name)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                    >
                      View Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommendations */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">KENYA OVERWATCH Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <h4 className="text-red-400 font-medium mb-2">High Priority</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Install speed bumps at Mombasa Road Junction</li>
                <li>• Add traffic lights at Nairobi CBD Roundabout</li>
                <li>• Increase police patrols on Thika Superhighway</li>
              </ul>
            </div>
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <h4 className="text-yellow-400 font-medium mb-2">Medium Priority</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Improve lighting at Nakuru Town</li>
                <li>• Road markings refresh on Kisumu Roundabout</li>
                <li>• Add warning signs on Mombasa-Malindi Road</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
