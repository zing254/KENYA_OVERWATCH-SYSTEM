import React from 'react'
import { Alert as AlertType } from '@/types'

interface AlertProps {
  alert: AlertType
  onAcknowledge?: (id: string) => void
  loading?: boolean
}

const AlertCard: React.FC<AlertProps> = ({ alert, onAcknowledge, loading = false }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-600'
      case 'medium': return 'bg-yellow-600'
      case 'low': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="card mb-3 border-l-4" style={{
      borderLeftColor: alert.severity === 'critical' ? '#dc2626' : 
                       alert.severity === 'high' ? '#ea580c' : 
                       alert.severity === 'medium' ? '#ca8a04' : '#16a34a'
    }}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getSeverityColor(alert.severity)}`}>
              {alert.severity.toUpperCase()}
            </span>
            <span className="text-sm text-gray-400">
              {new Date(alert.created_at).toLocaleString()}
            </span>
          </div>
          
          <h4 className="font-semibold text-white mb-1">{alert.title}</h4>
          <p className="text-sm text-gray-300">{alert.message}</p>
          
          {alert.risk_score && (
            <div className="mt-2">
              <span className="text-xs text-gray-400">Risk Score: </span>
              <span className="text-xs font-medium text-white">{alert.risk_score.toFixed(2)}</span>
            </div>
          )}
          
          {alert.camera_id && (
            <div className="mt-1">
              <span className="text-xs text-gray-400">Camera: </span>
              <span className="text-xs font-medium text-white">{alert.camera_id}</span>
            </div>
          )}
        </div>
        
        <div className="ml-4 flex flex-col items-end">
          {alert.acknowledged ? (
            <span className="text-xs text-green-400 font-medium">Acknowledged</span>
          ) : (
            <button
              onClick={() => onAcknowledge?.(alert.id)}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
            >
              {loading ? 'Processing...' : 'Acknowledge'}
            </button>
          )}
          
          {alert.requires_action && (
            <span className="text-xs text-yellow-400 mt-1">Action Required</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlertCard