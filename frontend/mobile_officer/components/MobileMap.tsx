'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Incident {
  id: string
  title: string
  location: string
  coordinates?: { lat: number; lng: number }
  severity: string
  status: string
  type: string
}

interface Team {
  id: string
  name: string
  location?: { lat: number; lng: number }
  status: string
  type: string
}

interface MobileMapProps {
  center: { lat: number; lng: number }
  zoom: number
  incidents: Incident[]
  teams: Team[]
  myLocation: { lat: number; lng: number } | null
  onIncidentClick?: (incident: Incident) => void
  onTeamClick?: (team: Team) => void
}

const createIcon = (color: string, size: number = 28) => {
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

const INCIDENT_ICONS = {
  critical: createIcon('#dc2626'),
  high: createIcon('#ea580c'),
  medium: createIcon('#ca8a04'),
  low: createIcon('#16a34a'),
}

const TEAM_ICON = createIcon('#3b82f6', 24)
const MY_LOCATION_ICON = createIcon('#22c55e', 20)

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function MapCenterUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView([center.lat, center.lng])
  }, [center, map])
  
  return null
}

export default function MobileMap({ 
  center, 
  zoom, 
  incidents, 
  teams, 
  myLocation,
  onIncidentClick,
  onTeamClick 
}: MobileMapProps) {
  const activeIncidents = incidents.filter(i => i.status === 'active')

  return (
    <MapContainer 
      center={[center.lat, center.lng]} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapCenterUpdater center={center} />

      {/* My Location */}
      {myLocation && (
        <>
          <Marker 
            position={[myLocation.lat, myLocation.lng]}
            icon={MY_LOCATION_ICON}
          >
            <Popup>
              <div className="text-center">
                <strong>My Location</strong>
              </div>
            </Popup>
          </Marker>
          <Circle 
            center={[myLocation.lat, myLocation.lng]} 
            radius={100} 
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2 }}
          />
        </>
      )}

      {/* Active Incidents */}
      {activeIncidents.map(incident => (
        incident.coordinates && (
          <Marker 
            key={incident.id}
            position={[incident.coordinates.lat, incident.coordinates.lng]}
            icon={INCIDENT_ICONS[incident.severity as keyof typeof INCIDENT_ICONS] || INCIDENT_ICONS.medium}
            eventHandlers={{
              click: () => onIncidentClick?.(incident),
            }}
          >
            <Popup>
              <div className="min-w-[150px]">
                <div className={`px-2 py-1 rounded text-xs font-bold text-white mb-1 ${
                  incident.severity === 'critical' ? 'bg-red-600' :
                  incident.severity === 'high' ? 'bg-orange-500' :
                  incident.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  {incident.severity.toUpperCase()}
                </div>
                <div className="font-bold text-sm">{incident.title}</div>
                <div className="text-xs text-gray-600 mt-1">{incident.location}</div>
                <div className="text-xs text-gray-500 mt-1">{incident.type}</div>
              </div>
            </Popup>
          </Marker>
        )
      ))}

      {/* Teams */}
      {teams.filter(t => t.location).map(team => (
        <Marker 
          key={team.id}
          position={[team.location!.lat, team.location!.lng]}
          icon={TEAM_ICON}
          eventHandlers={{
            click: () => onTeamClick?.(team),
          }}
        >
          <Popup>
            <div className="min-w-[150px]">
              <div className="font-bold text-sm">{team.name}</div>
              <div className={`text-xs mt-1 ${
                team.status === 'available' ? 'text-green-600' :
                team.status === 'deployed' ? 'text-blue-600' : 'text-red-600'
              }`}>
                {team.status?.toUpperCase()}
              </div>
              <div className="text-xs text-gray-600 mt-1">{team.type}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
