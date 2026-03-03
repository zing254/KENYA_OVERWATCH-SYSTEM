'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents, SVGOverlay } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { 
  Layers, Satellite, MapPin, Navigation, RefreshCw, Users, Video, 
  AlertTriangle, Crosshair, Clock, MapPinned, Zap, Car, Footprints
} from 'lucide-react'

// Kenya/Nairobi center coordinates
export const NAIROBI_CENTER: [number, number] = [-1.2921, 36.8219]
export const KENYA_BOUNDS = [[-5, 32], [5, 42]]

// Map tile providers
const MAP_LAYERS = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    name: 'Standard'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    name: 'Satellite'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
    name: 'Dark'
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    name: 'Terrain'
  }
}

// Custom marker icons
const createIcon = (color: string, size: number = 24, pulse: boolean = false) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${pulse ? 'animation: pulse 2s infinite;' : ''}
      "></div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 ${color}80; }
          70% { box-shadow: 0 0 0 10px ${color}00; }
          100% { box-shadow: 0 0 0 0 ${color}00; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  })
}

// Team marker with direction indicator
const createTeamIcon = (color: string, status: string, heading: number = 0) => {
  return L.divIcon({
    className: 'custom-marker team-marker',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
      ">
        <div style="
          background-color: ${color};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ${status === 'moving' ? 'animation: pulse 1.5s infinite;' : ''}
        "></div>
        <div style="
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%) rotate(${heading}deg);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 8px solid ${color};
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

// Different icons for different entity types
export const INCIDENT_ICON = createIcon('#ef4444', 28, true) // Red - pulsing
export const CAMERA_ICON = createIcon('#3b82f6', 20) // Blue
export const TEAM_AVAILABLE_ICON = createIcon('#22c55e', 24) // Green
export const TEAM_DEPLOYED_ICON = createIcon('#f97316', 24) // Orange
export const TEAM_MOVING_ICON = createIcon('#22c55e', 24, true) // Green - moving
export const ALERT_ICON = createIcon('#eab308', 22, true) // Yellow - pulsing
export const OFFICER_ICON = createIcon('#8b5cf6', 20) // Purple
export const CITIZEN_ICON = createIcon('#06b6d4', 18) // Cyan
export const FLAGGED_ICON = createIcon('#dc2626', 26, true) // Red - flagged vehicle

// Route polyline for navigation
const createRoutePolyline = (positions: [number, number][]) => {
  return L.polyline(positions, {
    color: '#3b82f6',
    weight: 4,
    opacity: 0.8,
    dashArray: '10, 10',
    lineCap: 'round',
    lineJoin: 'round'
  })
}

// Default icon fix for Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface MapMarker {
  id: string
  position: [number, number]
  type: 'incident' | 'camera' | 'team' | 'alert' | 'officer' | 'citizen' | 'flagged'
  title: string
  description?: string
  status?: string
  severity?: string
  heading?: number
  speed?: number
  icon?: L.DivIcon
  route?: [number, number][]
}

interface LiveMapProps {
  markers?: MapMarker[]
  center?: [number, number]
  zoom?: number
  showControls?: boolean
  onMarkerClick?: (marker: MapMarker) => void
  selectedMarker?: string
  autoRefresh?: boolean
  refreshInterval?: number
  showSatellite?: boolean
  showNavigation?: boolean
}

function MapControls({ zoom, autoRefresh, refreshInterval, onRefresh }: { 
  zoom: number
  autoRefresh?: boolean
  refreshInterval?: number
  onRefresh?: () => void
}) {
  const map = useMap()
  
  useEffect(() => {
    if (zoom) {
      map.setZoom(zoom)
    }
  }, [zoom, map])
  
  useEffect(() => {
    if (autoRefresh && refreshInterval) {
      const interval = setInterval(() => {
        onRefresh?.()
      }, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, onRefresh])
  
  return null
}

function LocationMarker({ onLocationUpdate }: { onLocationUpdate?: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  
  useMapEvents({
    locationfound(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
      onLocationUpdate?.(e.latlng.lat, e.latlng.lng)
    },
  })
  
  return position ? (
    <Circle 
      center={position} 
      radius={50} 
      pathOptions={{ 
        color: '#8b5cf6', 
        fillColor: '#8b5cf6', 
        fillOpacity: 0.3 
      }} 
    />
  ) : null
}

export default function LiveMap({
  markers = [],
  center = NAIROBI_CENTER,
  zoom = 13,
  showControls = true,
  onMarkerClick,
  selectedMarker,
  autoRefresh = true,
  refreshInterval = 30000,
  showSatellite = true,
  showNavigation = true,
}: LiveMapProps) {
  const [mounted, setMounted] = useState(false)
  const [activeLayer, setActiveLayer] = useState<string>('all')
  const [mapType, setMapType] = useState<keyof typeof MAP_LAYERS>('standard')
  const [mapReady, setMapReady] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<[number, number][] | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getIcon = (marker: MapMarker) => {
    if (marker.icon) return marker.icon
    
    switch (marker.type) {
      case 'incident':
        return INCIDENT_ICON
      case 'camera':
        return CAMERA_ICON
      case 'team':
        if (marker.status === 'moving') return createTeamIcon('#22c55e', 'moving', marker.heading)
        return marker.status === 'deployed' ? TEAM_DEPLOYED_ICON : TEAM_AVAILABLE_ICON
      case 'alert':
        return ALERT_ICON
      case 'officer':
        return OFFICER_ICON
      case 'citizen':
        return CITIZEN_ICON
      case 'flagged':
        return FLAGGED_ICON
      default:
        return CAMERA_ICON
    }
  }

  const filteredMarkers = activeLayer === 'all' 
    ? markers 
    : markers.filter(m => m.type === activeLayer)

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    setLastUpdate(new Date())
    setTimeout(() => setIsRefreshing(false), 1000)
  }, [])

  const handleRouteClick = (marker: MapMarker) => {
    if (marker.route) {
      setSelectedRoute(marker.route)
    }
  }

  const getMarkerCounts = () => {
    return {
      incident: markers.filter(m => m.type === 'incident').length,
      camera: markers.filter(m => m.type === 'camera').length,
      team: markers.filter(m => m.type === 'team').length,
      alert: markers.filter(m => m.type === 'alert').length,
      citizen: markers.filter(m => m.type === 'citizen').length,
      flagged: markers.filter(m => m.type === 'flagged').length,
    }
  }

  const counts = getMarkerCounts()

  return (
    <div className="relative w-full h-full">
      {/* Map Type Controls */}
      {showControls && showSatellite && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-2 flex flex-col gap-1">
          <div className="text-xs font-semibold text-gray-500 mb-1 px-2">MAP VIEW</div>
          {Object.entries(MAP_LAYERS).map(([key, layer]) => (
            <button
              key={key}
              onClick={() => setMapType(key as keyof typeof MAP_LAYERS)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                mapType === key 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {key === 'satellite' ? <Satellite className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              {layer.name}
            </button>
          ))}
        </div>
      )}

      {/* Layer Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-2">
          <div className="text-xs font-semibold text-gray-500 mb-2 px-2">LAYERS</div>
          {[
            { id: 'all', label: 'All', icon: Layers, count: markers.length, color: '#6b7280' },
            { id: 'incident', label: 'Incidents', icon: AlertTriangle, count: counts.incident, color: '#ef4444' },
            { id: 'camera', label: 'Cameras', icon: Video, count: counts.camera, color: '#3b82f6' },
            { id: 'team', label: 'Teams', icon: Users, count: counts.team, color: '#22c55e' },
            { id: 'citizen', label: 'Citizens', icon: MapPinned, count: counts.citizen, color: '#06b6d4' },
            { id: 'flagged', label: 'Flagged', icon: Zap, count: counts.flagged, color: '#dc2626' },
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                activeLayer === layer.id 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <layer.icon className="w-4 h-4" style={{ color: layer.color }} />
                {layer.label}
              </div>
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {layer.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Auto-refresh indicator */}
      {showControls && autoRefresh && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm text-gray-600">
            Auto-refresh: {Math.round(refreshInterval / 1000)}s
          </span>
          <span className="text-xs text-gray-400">
            Last: {mounted && lastUpdate ? lastUpdate.toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' }) : '--:--:--'}
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="font-semibold mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Nairobi, Kenya
        </div>
        <div className="text-gray-500 flex items-center gap-2">
          <Navigation className="w-3 h-3" />
          {filteredMarkers.length} markers shown
        </div>
        {selectedRoute && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-blue-600 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Route: {selectedRoute.length} points
          </div>
        )}
      </div>

      {/* Navigation info */}
      {showNavigation && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 text-xs">
          <div className="font-semibold mb-2 flex items-center gap-2">
            <Car className="w-4 h-4" />
            Navigation
          </div>
          <div className="space-y-1 text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Available Team
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              Deployed Team
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              Flagged Vehicle
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        className="w-full h-full"
        style={{ minHeight: '500px' }}
        zoomControl={showControls}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution={MAP_LAYERS[mapType].attribution}
          url={MAP_LAYERS[mapType].url}
        />
        
        <MapControls 
          zoom={zoom} 
          autoRefresh={autoRefresh}
          refreshInterval={refreshInterval}
          onRefresh={handleRefresh}
        />
        
        {/* Boundary circle for Nairobi */}
        <Circle
          center={NAIROBI_CENTER}
          radius={25000}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.05,
          }}
        />

        {/* Route polyline */}
        {selectedRoute && (
          <Polyline
            positions={selectedRoute}
            pathOptions={{
              color: '#3b82f6',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10',
            }}
          />
        )}

        {/* Markers */}
        {filteredMarkers.filter(m => m.position && m.position[0] != null && m.position[1] != null && !isNaN(m.position[0]) && !isNaN(m.position[1])).map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={getIcon(marker)}
            eventHandlers={{
              click: () => {
                onMarkerClick?.(marker)
                handleRouteClick(marker)
              },
            }}
          >
            <Popup>
              <div className="min-w-[220px]">
                <div className="flex items-center gap-2 mb-2">
                  {marker.type === 'flagged' && <Zap className="w-4 h-4 text-red-500" />}
                  <div className="font-semibold text-sm">{marker.title}</div>
                </div>
                {marker.description && (
                  <div className="text-xs text-gray-600 mb-2">{marker.description}</div>
                )}
                <div className="flex flex-wrap gap-1 text-xs">
                  <span className="px-2 py-1 bg-gray-100 rounded capitalize">
                    {marker.type}
                  </span>
                  {marker.status && (
                    <span className={`px-2 py-1 rounded capitalize ${
                      marker.status === 'available' ? 'bg-green-100 text-green-700' :
                      marker.status === 'deployed' ? 'bg-orange-100 text-orange-700' :
                      marker.status === 'moving' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100'
                    }`}>
                      {marker.status}
                    </span>
                  )}
                  {marker.severity && (
                    <span className={`px-2 py-1 rounded ${
                      marker.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      marker.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100'
                    }`}>
                      {marker.severity}
                    </span>
                  )}
                  {marker.speed !== undefined && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      {marker.speed} km/h
                    </span>
                  )}
                </div>
                {marker.type === 'team' && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <button 
                      onClick={() => handleRouteClick(marker)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      Show Route
                    </button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
