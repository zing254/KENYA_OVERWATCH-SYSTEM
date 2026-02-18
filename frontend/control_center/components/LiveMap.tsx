'use client'

import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Kenya/Nairobi center coordinates
export const NAIROBI_CENTER: [number, number] = [-1.2921, 36.8219]
export const KENYA_BOUNDS = [[-5, 32], [5, 42]]

// Custom marker icons
const createIcon = (color: string, size: number = 24) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  })
}

// Different icons for different entity types
export const INCIDENT_ICON = createIcon('#ef4444', 28) // Red
export const CAMERA_ICON = createIcon('#3b82f6', 20) // Blue
export const TEAM_AVAILABLE_ICON = createIcon('#22c55e', 24) // Green
export const TEAM_DEPLOYED_ICON = createIcon('#f97316', 24) // Orange
export const ALERT_ICON = createIcon('#eab308', 22) // Yellow
export const OFFICER_ICON = createIcon('#8b5cf6', 20) // Purple

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
  type: 'incident' | 'camera' | 'team' | 'alert' | 'officer'
  title: string
  description?: string
  status?: string
  severity?: string
  icon?: L.DivIcon
}

interface LiveMapProps {
  markers?: MapMarker[]
  center?: [number, number]
  zoom?: number
  showControls?: boolean
  onMarkerClick?: (marker: MapMarker) => void
  selectedMarker?: string
}

function MapControls({ zoom }: { zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    if (zoom) {
      map.setZoom(zoom)
    }
  }, [zoom, map])
  
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
  selectedMarker
}: LiveMapProps) {
  const [activeLayer, setActiveLayer] = useState<string>('all')
  const [mapReady, setMapReady] = useState(false)

  const getIcon = (marker: MapMarker) => {
    if (marker.icon) return marker.icon
    
    switch (marker.type) {
      case 'incident':
        return INCIDENT_ICON
      case 'camera':
        return CAMERA_ICON
      case 'team':
        return marker.status === 'deployed' ? TEAM_DEPLOYED_ICON : TEAM_AVAILABLE_ICON
      case 'alert':
        return ALERT_ICON
      case 'officer':
        return OFFICER_ICON
      default:
        return CAMERA_ICON
    }
  }

  const filteredMarkers = activeLayer === 'all' 
    ? markers 
    : markers.filter(m => m.type === activeLayer)

  return (
    <div className="relative w-full h-full">
      {/* Layer Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-2">
          <div className="text-xs font-semibold text-gray-500 mb-2 px-2">LAYERS</div>
          {[
            { id: 'all', label: 'All', color: '#6b7280' },
            { id: 'incident', label: 'Incidents', color: '#ef4444' },
            { id: 'camera', label: 'Cameras', color: '#3b82f6' },
            { id: 'team', label: 'Teams', color: '#22c55e' },
            { id: 'alert', label: 'Alerts', color: '#eab308' },
            { id: 'officer', label: 'Officers', color: '#8b5cf6' },
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                activeLayer === layer.id 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: layer.color }}
              />
              {layer.label}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="font-semibold mb-2">Nairobi, Kenya</div>
        <div className="text-gray-500">
          {filteredMarkers.length} markers shown
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        style={{ minHeight: '500px' }}
        zoomControl={showControls}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapControls zoom={zoom} />
        
        {/* Boundary circle for Nairobi */}
        <Circle
          center={NAIROBI_CENTER}
          radius={25000} // 25km radius
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.05,
          }}
        />

        {/* Markers */}
        {filteredMarkers.map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={getIcon(marker)}
            eventHandlers={{
              click: () => onMarkerClick?.(marker),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="font-semibold text-sm mb-1">{marker.title}</div>
                {marker.description && (
                  <div className="text-xs text-gray-600 mb-2">{marker.description}</div>
                )}
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-gray-100 rounded capitalize">
                    {marker.type}
                  </span>
                  {marker.status && (
                    <span className="px-2 py-1 bg-gray-100 rounded capitalize">
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
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
