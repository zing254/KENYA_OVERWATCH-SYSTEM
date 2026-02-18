import React from 'react'
import { Milestone } from '@/types'
import { CheckCircle, Clock, AlertTriangle, XCircle, FileText, Activity, Wrench, Edit } from 'lucide-react'

interface MilestoneCardProps {
  milestone: Milestone
  onClick?: (milestone: Milestone) => void
  onSubmitForApproval?: (id: string) => void
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onEdit?: (milestone: Milestone) => void
  userRole?: 'operator' | 'supervisor' | 'admin'
  loading?: boolean
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  onClick,
  onSubmitForApproval,
  onApprove,
  onReject,
  userRole = 'operator',
  loading = false
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending_approval':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'in_progress':
        return <Activity className="w-5 h-5 text-blue-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-900/30 border-green-600'
      case 'rejected':
        return 'bg-red-900/30 border-red-600'
      case 'pending_approval':
        return 'bg-yellow-900/30 border-yellow-600'
      case 'in_progress':
        return 'bg-blue-900/30 border-blue-600'
      case 'cancelled':
        return 'bg-gray-900/30 border-gray-600'
      default:
        return 'bg-gray-800/50 border-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600'
      case 'high':
        return 'bg-orange-600'
      case 'medium':
        return 'bg-yellow-600'
      default:
        return 'bg-green-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'development':
        return <Wrench className="w-4 h-4" />
      case 'incident_case':
        return <AlertTriangle className="w-4 h-4" />
      case 'evidence_review':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div 
      className={`card mb-3 border-l-4 cursor-pointer hover:bg-gray-800/50 transition-colors ${getStatusColor(milestone.status)}`}
      style={{ borderLeftColor: milestone.status === 'approved' ? '#22c55e' : milestone.status === 'rejected' ? '#dc2626' : milestone.status === 'pending_approval' ? '#eab308' : milestone.status === 'in_progress' ? '#3b82f6' : '#6b7280' }}
      onClick={() => onClick?.(milestone)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(milestone.status)}
            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getPriorityColor(milestone.priority)}`}>
              {milestone.priority.toUpperCase()}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              {getTypeIcon(milestone.type)}
              {milestone.type.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
              milestone.status === 'approved' ? 'bg-green-600' :
              milestone.status === 'rejected' ? 'bg-red-600' :
              milestone.status === 'pending_approval' ? 'bg-yellow-600' :
              milestone.status === 'in_progress' ? 'bg-blue-600' :
              milestone.status === 'cancelled' ? 'bg-gray-600' : 'bg-gray-600'
            }`}>
              {milestone.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <h4 className="font-semibold text-white mb-1">{milestone.title}</h4>
          <p className="text-sm text-gray-300 line-clamp-2">{milestone.description}</p>
          
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
            <div>
              <span>Created: </span>
              <span className="text-gray-300">{formatDate(milestone.created_at)}</span>
            </div>
            {milestone.due_date && (
              <div>
                <span>Due: </span>
                <span className={new Date(milestone.due_date) < new Date() ? 'text-red-400' : 'text-gray-300'}>
                  {formatDate(milestone.due_date)}
                </span>
              </div>
            )}
            {milestone.assigned_to && (
              <div>
                <span>Assigned: </span>
                <span className="text-gray-300">{milestone.assigned_to}</span>
              </div>
            )}
            {milestone.approved_by && (
              <div>
                <span>Approved by: </span>
                <span className="text-green-400">{milestone.approved_by}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="ml-4 flex flex-col items-end gap-2">
          {milestone.status === 'draft' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSubmitForApproval?.(milestone.id)
              }}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
            >
              {loading ? 'Processing...' : 'Submit for Approval'}
            </button>
          )}
          
          {milestone.status === 'in_progress' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSubmitForApproval?.(milestone.id)
              }}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
            >
              {loading ? 'Processing...' : 'Submit for Approval'}
            </button>
          )}
          
          {milestone.status === 'pending_approval' && (userRole === 'supervisor' || userRole === 'admin') && (
            <div className="flex flex-col gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onApprove?.(milestone.id)
                }}
                disabled={loading}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
              >
                Approve
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onReject?.(milestone.id)
                }}
                disabled={loading}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
      
      {milestone.rejection_reason && (
        <div className="mt-3 p-2 bg-red-900/30 border border-red-600 rounded">
          <span className="text-xs text-red-400 font-medium">Rejection Reason: </span>
          <span className="text-xs text-red-300">{milestone.rejection_reason}</span>
        </div>
      )}
      
      {milestone.approval_notes && milestone.status === 'approved' && (
        <div className="mt-3 p-2 bg-green-900/30 border border-green-600 rounded">
          <span className="text-xs text-green-400 font-medium">Approval Notes: </span>
          <span className="text-xs text-green-300">{milestone.approval_notes}</span>
        </div>
      )}
    </div>
  )
}

export default MilestoneCard
