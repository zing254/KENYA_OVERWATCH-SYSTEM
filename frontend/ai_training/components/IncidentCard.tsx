import React from 'react'
import { ProductionIncident } from '@/types'
import { getSeverityColor } from '@/utils/helpers'

interface IncidentCardProps {
  incident: ProductionIncident
  onClick?: () => void
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onClick }) => {
  return (
    <div 
      className="card hover:bg-gray-700 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">{incident.title}</h4>
          <p className="text-sm text-gray-400 mb-2">{incident.location}</p>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Type:</span>
            <span className="text-gray-200">{incident.type.replace('_', ' ')}</span>
            
            <span className="text-gray-400 ml-2">ID:</span>
            <span className="text-gray-200 font-mono">{incident.id.slice(-8)}</span>
          </div>
        </div>
        
        <div className="text-right ml-4">
          <div 
            className="px-2 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: getSeverityColor(incident.severity) + '20', color: getSeverityColor(incident.severity) }}
          >
            {incident.severity.toUpperCase()}
          </div>
          
          <div className="mt-2">
            <div className="text-xs text-gray-400">Risk Score</div>
            <div className="text-sm font-medium text-white">
              {incident.risk_assessment.risk_score.toFixed(2)}
            </div>
          </div>
          
          <div className={`px-2 py-1 rounded text-xs font-medium mt-2 ${
            incident.status === 'active' ? 'bg-green-100 text-green-800' :
            incident.status === 'responding' ? 'bg-blue-100 text-blue-800' :
            incident.status === 'resolved' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {incident.status.replace('_', ' ')}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{new Date(incident.created_at).toLocaleString()}</span>
        <span className="text-gray-300">{incident.risk_assessment.recommended_action}</span>
      </div>
      
      {incident.requires_human_review && !incident.human_review_completed && (
        <div className="mt-2 p-2 bg-yellow-900 bg-opacity-20 rounded border border-yellow-500">
          <span className="text-xs text-yellow-400">⚠️ Requires Human Review</span>
        </div>
      )}
    </div>
  )
}

export default IncidentCard