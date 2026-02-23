import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { Alert, ProductionIncident, ResponseTeam } from '@/types'
import { Bell, MapPin, Users, Shield, Clock, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react'
import ApiService from '@/utils/api'

export default function MobileOfficer() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [incidents, setIncidents] = useState<ProductionIncident[]>([])
  const [teams, setTeams] = useState<ResponseTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'alerts' | 'incidents' | 'teams'>('alerts')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [alertsData, incidentsData, teamsData] = await Promise.all([
        ApiService.getAlerts({ acknowledged: false }),
        ApiService.getIncidents({ status: 'active' }),
        fetch('http://localhost:8000/api/teams').then(r => r.json()).then(d => d.teams || d)
      ])
      setAlerts(alertsData)
      setIncidents(incidentsData)
      setTeams(teamsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await ApiService.acknowledgeAlert(alertId, {
        acknowledged_by: 'officer_01',
        action_taken: 'Acknowledged from mobile app'
      })
      loadData()
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high')

  return (
    <Layout title="Kenya Overwatch - Mobile Officer">
      <div className="min-h-screen bg-gray-900 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-bold">Officer Dashboard</h1>
              <p className="text-blue-200 text-sm">Nairobi CBD Sector</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse"></div>
              <span className="text-white text-sm">Online</span>
            </div>
          </div>
        </div>

        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <div className="bg-red-600 p-3 flex items-center gap-3">
            <AlertTriangle className="text-white w-5 h-5" />
            <span className="text-white font-medium flex-1">
              {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 p-3">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{alerts.length}</div>
            <div className="text-gray-400 text-xs">Active Alerts</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{incidents.length}</div>
            <div className="text-gray-400 text-xs">Incidents</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">
              {teams.filter(t => t.status === 'available').length}
            </div>
            <div className="text-gray-400 text-xs">Teams Available</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {(['alerts', 'incidents', 'teams'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center font-medium capitalize ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : activeTab === 'alerts' && (
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No active alerts</div>
              ) : (
                alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`bg-gray-800 rounded-lg p-3 border-l-4 ${
                      alert.severity === 'critical' ? 'border-red-500' :
                      alert.severity === 'high' ? 'border-orange-500' :
                      alert.severity === 'medium' ? 'border-yellow-500' : 'border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            alert.severity === 'critical' ? 'bg-red-600' :
                            alert.severity === 'high' ? 'bg-orange-600' :
                            alert.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                          } text-white`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          {alert.camera_id && (
                            <span className="text-gray-500 text-xs">{alert.camera_id}</span>
                          )}
                        </div>
                        <h3 className="text-white font-medium mt-1">{alert.title}</h3>
                        <p className="text-gray-400 text-sm">{alert.message}</p>
                        <div className="flex items-center gap-1 mt-2 text-gray-500 text-xs">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Ack
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-2">
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No active incidents</div>
              ) : (
                incidents.map(incident => (
                  <div key={incident.id} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            incident.severity === 'critical' ? 'bg-red-600' :
                            incident.severity === 'high' ? 'bg-orange-600' :
                            'bg-yellow-600'
                          } text-white`}>
                            {incident.severity.toUpperCase()}
                          </span>
                          <span className="text-gray-500 text-xs">{incident.id}</span>
                        </div>
                        <h3 className="text-white font-medium mt-1">{incident.title}</h3>
                        <div className="flex items-center gap-1 mt-1 text-gray-400 text-sm">
                          <MapPin className="w-3 h-3" />
                          {incident.location}
                        </div>
                      </div>
                      <ChevronRight className="text-gray-500 w-5 h-5" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="space-y-2">
              {teams.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No teams available</div>
              ) : (
                teams.map(team => (
                  <div key={team.id} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          team.status === 'available' ? 'bg-green-500' :
                          team.status === 'deployed' ? 'bg-orange-500' : 'bg-gray-500'
                        }`}></div>
                        <div>
                          <h3 className="text-white font-medium">{team.name}</h3>
                          <p className="text-gray-400 text-sm">{team.type} • {team.members} members</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        team.status === 'available' ? 'bg-green-600' :
                        team.status === 'deployed' ? 'bg-orange-600' : 'bg-gray-600'
                      } text-white`}>
                        {team.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around py-3">
          <button className="flex flex-col items-center text-blue-400">
            <Bell className="w-6 h-6" />
            <span className="text-xs mt-1">Alerts</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <Shield className="w-6 h-6" />
            <span className="text-xs mt-1">Incidents</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <Users className="w-6 h-6" />
            <span className="text-xs mt-1">Teams</span>
          </button>
        </div>
      </div>
    </Layout>
  )
}
