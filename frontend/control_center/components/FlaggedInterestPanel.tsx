'use client'

import { useState, useEffect } from 'react'
import { 
  Flag, AlertTriangle, ChevronDown, ChevronUp, MapPin, Calendar, 
  Clock, Car, Eye, X, Filter, RefreshCw, CheckCircle, XCircle,
  Phone, User, FileText
} from 'lucide-react'

interface FlaggedInterest {
  id: string
  plate_number: string
  vehicle: {
    make: string
    model: string
    color: string
    type: string
  }
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'active' | 'captured' | 'escaped'
  notes: string
  incident_id: string
  detection_count: number
  last_seen: {
    camera: string
    location: string
    latitude: number
    longitude: number
    timestamp: string
  }
  created_at: string
}

export default function FlaggedInterestPanel() {
  const [flaggedItems, setFlaggedItems] = useState<FlaggedInterest[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFlaggedInterests()
    const interval = setInterval(loadFlaggedInterests, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadFlaggedInterests = async () => {
    setIsLoading(true)
    // Mock data - in production, fetch from API
    const mockData: FlaggedInterest[] = [
      {
        id: '1',
        plate_number: 'KAA 123A',
        vehicle: { make: 'Toyota', model: 'Prado', color: 'Black', type: 'suv' },
        priority: 'HIGH',
        status: 'active',
        notes: 'Suspected in multiple hit-and-run incidents',
        incident_id: 'INC-2024-001',
        detection_count: 5,
        last_seen: {
          camera: 'CAM-101',
          location: 'Kenyatta Avenue',
          latitude: -1.2921,
          longitude: 36.8219,
          timestamp: '2024-02-22T14:30:00Z'
        },
        created_at: '2024-02-15T08:00:00Z'
      },
      {
        id: '2',
        plate_number: 'KBB 456B',
        vehicle: { make: 'Nissan', model: 'Skyline', color: 'Red', type: 'saloon' },
        priority: 'HIGH',
        status: 'escaped',
        notes: 'Fled from traffic police at high speed',
        incident_id: 'INC-2024-002',
        detection_count: 8,
        last_seen: {
          camera: 'CAM-205',
          location: 'Ngong Road',
          latitude: -1.3000,
          longitude: 36.7800,
          timestamp: '2024-02-22T12:15:00Z'
        },
        created_at: '2024-02-18T10:30:00Z'
      },
      {
        id: '3',
        plate_number: 'KCC 789C',
        vehicle: { make: 'Honda', model: 'Civic', color: 'Silver', type: 'saloon' },
        priority: 'MEDIUM',
        status: 'active',
        notes: 'Outstanding traffic violations',
        incident_id: 'INC-2024-003',
        detection_count: 3,
        last_seen: {
          camera: 'CAM-103',
          location: 'Mombasa Road',
          latitude: -1.3100,
          longitude: 36.8500,
          timestamp: '2024-02-22T11:45:00Z'
        },
        created_at: '2024-02-20T14:00:00Z'
      },
      {
        id: '4',
        plate_number: 'KDD 321D',
        vehicle: { make: 'Toyota', model: 'Hiace', color: 'White', type: 'matatu' },
        priority: 'MEDIUM',
        status: 'captured',
        notes: 'Overloading passengers',
        incident_id: 'INC-2024-004',
        detection_count: 2,
        last_seen: {
          camera: 'CAM-110',
          location: 'Westlands',
          latitude: -1.2650,
          longitude: 36.8000,
          timestamp: '2024-02-21T16:20:00Z'
        },
        created_at: '2024-02-19T09:15:00Z'
      },
      {
        id: '5',
        plate_number: 'KEE 654E',
        vehicle: { make: 'Mercedes', model: 'E-Class', color: 'Black', type: 'saloon' },
        priority: 'LOW',
        status: 'active',
        notes: 'Expired insurance',
        incident_id: 'INC-2024-005',
        detection_count: 1,
        last_seen: {
          camera: 'CAM-115',
          location: 'Kilimani',
          latitude: -1.2800,
          longitude: 36.7900,
          timestamp: '2024-02-22T09:30:00Z'
        },
        created_at: '2024-02-21T11:00:00Z'
      }
    ]
    setFlaggedItems(mockData)
    setIsLoading(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-300'
      case 'MEDIUM': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'LOW': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'captured': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'escaped': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Flag className="w-4 h-4 text-gray-500" />
    }
  }

  const filteredItems = flaggedItems.filter(item => {
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false
    if (filterStatus !== 'all' && item.status !== filterStatus) return false
    return true
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flag className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">Flagged Interests</h2>
              <p className="text-red-100 text-sm">Priority offenders & re-identification tracking</p>
            </div>
          </div>
          <button 
            onClick={loadFlaggedInterests}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
            <AlertTriangle className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">
              {flaggedItems.filter(i => i.status === 'active').length} Active
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
            <XCircle className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">
              {flaggedItems.filter(i => i.status === 'escaped').length} Escaped
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
            <CheckCircle className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">
              {flaggedItems.filter(i => i.status === 'captured').length} Captured
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="escaped">Escaped</option>
            <option value="captured">Captured</option>
          </select>
        </div>
      </div>

      <div className="divide-y max-h-[600px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No flagged interests found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="hover:bg-gray-50 transition-colors">
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg text-gray-900">
                          {item.plate_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Car className="w-4 h-4" />
                        {item.vehicle.make} {item.vehicle.model} • {item.vehicle.color}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {item.detection_count} detections
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.last_seen.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {expandedId === item.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="px-4 pb-4 bg-gray-50 border-t">
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Incident ID
                      </div>
                      <div className="font-mono text-sm font-medium">{item.incident_id}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last Seen
                      </div>
                      <div className="text-sm font-medium">
                        {formatDate(item.last_seen.timestamp)} at {formatTime(item.last_seen.timestamp)}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Location
                      </div>
                      <div className="text-sm font-medium">{item.last_seen.location}</div>
                      <div className="text-xs text-gray-400">Camera: {item.last_seen.camera}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Flagged Since
                      </div>
                      <div className="text-sm font-medium">{formatDate(item.created_at)}</div>
                    </div>
                  </div>
                  
                  {item.notes && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-xs text-yellow-600 font-medium mb-1">Notes</div>
                      <div className="text-sm text-gray-700">{item.notes}</div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                      View on Map
                    </button>
                    <button className="px-4 py-2 border border-gray-300 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
                      Dispatch Team
                    </button>
                    <button className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                      Mark Captured
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
