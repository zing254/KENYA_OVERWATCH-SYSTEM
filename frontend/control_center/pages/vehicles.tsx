import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { Search, Car, User, FileText, AlertTriangle, Shield, Clock, Check, X, Download, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface Vehicle {
  plate_number: string
  vehicle_type: string
  make: string
  model: string
  year: number
  color: string
  owner_name: string
  owner_id: string
  insurance_status: string
  inspection_status: string
  license_expiry: string
  license_category: string
  points: number
  violations_count: number
}

const mockVehicles: Vehicle[] = [
  { plate_number: 'KAA001A', vehicle_type: 'saloon', make: 'Toyota', model: 'Corolla', year: 2020, color: 'White', owner_name: 'John Doe', owner_id: '12345678', insurance_status: 'valid', inspection_status: 'valid', license_expiry: '2026-12-31', license_category: 'B', points: 12, violations_count: 0 },
  { plate_number: 'KBB002B', vehicle_type: 'matatu', make: 'Toyota', model: 'Hiace', year: 2018, color: 'Blue', owner_name: 'Jane Smith', owner_id: '23456789', insurance_status: 'valid', inspection_status: 'expired', license_expiry: '2025-06-30', license_category: 'D', points: 8, violations_count: 2 },
  { plate_number: 'KCC003C', vehicle_type: 'pickup', make: 'Isuzu', model: 'D-Max', year: 2021, color: 'Silver', owner_name: 'Bob Wilson', owner_id: '34567890', insurance_status: 'expired', inspection_status: 'valid', license_expiry: '2026-03-15', license_category: 'C', points: 10, violations_count: 1 },
  { plate_number: 'KDD004D', vehicle_type: 'lorry', make: 'Mitsubishi', model: 'Fuso', year: 2019, color: 'Red', owner_name: 'Kenya Logistics Ltd', owner_id: '45678901', insurance_status: 'valid', inspection_status: 'valid', license_expiry: '2026-08-20', license_category: 'C', points: 12, violations_count: 0 },
  { plate_number: 'KEE005E', vehicle_type: 'bus', make: 'Scania', model: 'Interlink', year: 2022, color: 'Yellow', owner_name: 'Nairobi Bus Service', owner_id: '56789012', insurance_status: 'valid', inspection_status: 'valid', license_expiry: '2027-01-10', license_category: 'D', points: 12, violations_count: 0 },
]

export default function VehiclesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/vehicles`)
      const data = await res.json()
      setVehicles(data.vehicles || [])
    } catch (error) {
      console.error('Failed to fetch vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'json' | 'csv' = 'csv') => {
    try {
      const data = { total: vehicles.length, vehicles }
      if (format === 'csv') {
        const headers = Object.keys(vehicles[0] || {}).join(',')
        const rows = vehicles.map(v => Object.values(v).join(','))
        const csv = [headers, ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vehicles_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vehicles_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
      toast.success('Export completed')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed')
    }
  }

  const filteredVehicles = vehicles.filter(v => 
    v.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const isValid = status === 'valid'
    return (
      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${isValid ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
        {isValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        {status}
      </span>
    )
  }

  return (
    <Layout title="Vehicle Registry - KENYA OVERWATCH">
      <div className="space-y-6">
        {/* Search & Actions */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by plate number or owner name..."
                value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-green-500 w-full"
            />
            </div>
            <div className="flex gap-2">
              <button onClick={fetchVehicles} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button onClick={() => handleExport('json')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                <Download className="w-4 h-4" />
                JSON
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredVehicles.map((vehicle) => (
              <div 
                key={vehicle.plate_number}
                onClick={() => setSelectedVehicle(vehicle)}
                className={`bg-gray-800 rounded-xl p-4 border cursor-pointer transition-colors ${
                  selectedVehicle?.plate_number === vehicle.plate_number 
                    ? 'border-green-500 bg-green-900/20' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                      <Car className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{vehicle.plate_number}</h3>
                      <p className="text-gray-400 text-sm">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-orange-400 text-sm capitalize">{vehicle.vehicle_type}</span>
                    <p className="text-gray-500 text-xs">{vehicle.violations_count} violations</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vehicle Details */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 h-fit sticky top-6">
            {selectedVehicle ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Car className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">{selectedVehicle.plate_number}</h3>
                    <p className="text-gray-400">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
                    <p className="text-gray-500 text-sm">{selectedVehicle.color} {selectedVehicle.vehicle_type}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Owner</span>
                    <span className="text-white">{selectedVehicle.owner_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Owner ID</span>
                    <span className="text-white">{selectedVehicle.owner_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">License Category</span>
                    <span className="text-white">{selectedVehicle.license_category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">License Expiry</span>
                    <span className="text-white">{selectedVehicle.license_expiry}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Shield className="w-4 h-4" /> Insurance
                    </span>
                    {getStatusBadge(selectedVehicle.insurance_status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Inspection
                    </span>
                    {getStatusBadge(selectedVehicle.inspection_status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Points
                    </span>
                    <span className={`font-bold ${selectedVehicle.points < 6 ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedVehicle.points}/12
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <button 
                    onClick={() => toast.success(`Viewing violations for ${selectedVehicle.plate_number}`)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    View Violations
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a vehicle to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
