import React, { useState, useEffect } from 'react'
import { Milestone, MilestoneStatus, MilestoneType } from '@/types'
import MilestoneCard from './MilestoneCard'
import MilestoneForm from './MilestoneForm'
import { Plus, Filter, Search, RefreshCw, LayoutGrid, Table } from 'lucide-react'
import ApiService from '@/utils/api'

interface MilestoneListProps {
  userRole?: 'operator' | 'supervisor' | 'admin'
  currentUser: string
}

const MilestoneList: React.FC<MilestoneListProps> = ({
  userRole = 'operator',
  currentUser
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  
  const [filters, setFilters] = useState({
    status: '' as MilestoneStatus | '',
    type: '' as MilestoneType | '',
    search: ''
  })

  const fetchMilestones = async () => {
    setLoading(true)
    try {
      const data = await ApiService.getMilestones({
        status: filters.status || undefined,
        milestone_type: filters.type || undefined
      })
      setMilestones(data)
    } catch (error) {
      console.error('Error fetching milestones:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMilestones()
  }, [filters.status, filters.type])

  const handleCreateMilestone = async (milestoneData: Partial<Milestone>) => {
    try {
      await ApiService.createMilestone(milestoneData)
      setShowForm(false)
      fetchMilestones()
    } catch (error) {
      console.error('Error creating milestone:', error)
    }
  }

  const handleUpdateMilestone = async (milestoneData: Partial<Milestone>) => {
    if (!editingMilestone) return
    try {
      await ApiService.updateMilestone(editingMilestone.id, milestoneData)
      setEditingMilestone(null)
      fetchMilestones()
    } catch (error) {
      console.error('Error updating milestone:', error)
    }
  }

  const handleSubmitForApproval = async (id: string) => {
    try {
      await ApiService.submitMilestoneForApproval(id, currentUser)
      fetchMilestones()
    } catch (error) {
      console.error('Error submitting for approval:', error)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await ApiService.approveMilestone(id, currentUser, userRole)
      fetchMilestones()
    } catch (error) {
      console.error('Error approving milestone:', error)
    }
  }

  const handleRejectClick = (id: string) => {
    setRejectingId(id)
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectingId || !rejectReason) return
    
    try {
      await ApiService.rejectMilestone(rejectingId, currentUser, userRole, rejectReason)
      setShowRejectModal(false)
      setRejectReason('')
      setRejectingId(null)
      fetchMilestones()
    } catch (error) {
      console.error('Error rejecting milestone:', error)
    }
  }

  const filteredMilestones = milestones.filter(m => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        m.title.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower) ||
        m.assigned_to?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const statusCounts = {
    all: milestones.length,
    draft: milestones.filter(m => m.status === 'draft').length,
    in_progress: milestones.filter(m => m.status === 'in_progress').length,
    pending_approval: milestones.filter(m => m.status === 'pending_approval').length,
    approved: milestones.filter(m => m.status === 'approved').length,
    rejected: milestones.filter(m => m.status === 'rejected').length,
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-white">Milestones</h2>
          <button
            onClick={fetchMilestones}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 transition-colors ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Milestone
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilters({ ...filters, status: '' })}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            filters.status === '' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All ({statusCounts.all})
        </button>
        <button
          onClick={() => setFilters({ ...filters, status: 'draft' })}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            filters.status === 'draft' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Draft ({statusCounts.draft})
        </button>
        <button
          onClick={() => setFilters({ ...filters, status: 'in_progress' })}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            filters.status === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          In Progress ({statusCounts.in_progress})
        </button>
        <button
          onClick={() => setFilters({ ...filters, status: 'pending_approval' })}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            filters.status === 'pending_approval' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Pending Approval ({statusCounts.pending_approval})
        </button>
        <button
          onClick={() => setFilters({ ...filters, status: 'approved' })}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            filters.status === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Approved ({statusCounts.approved})
        </button>
        <button
          onClick={() => setFilters({ ...filters, status: 'rejected' })}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            filters.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Rejected ({statusCounts.rejected})
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search milestones..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">Type:</span>
        <button
          onClick={() => setFilters({ ...filters, type: '' })}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            filters.type === '' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilters({ ...filters, type: 'development' })}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            filters.type === 'development' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Development
        </button>
        <button
          onClick={() => setFilters({ ...filters, type: 'incident_case' })}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            filters.type === 'incident_case' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Incident Case
        </button>
        <button
          onClick={() => setFilters({ ...filters, type: 'evidence_review' })}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            filters.type === 'evidence_review' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Evidence Review
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : filteredMilestones.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No milestones found</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div>
          {filteredMilestones.map(milestone => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              userRole={userRole}
              onSubmitForApproval={handleSubmitForApproval}
              onApprove={handleApprove}
              onReject={handleRejectClick}
              onEdit={setEditingMilestone}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Assigned To</th>
                <th className="px-4 py-3 text-left font-medium">Due Date</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredMilestones.map(milestone => (
                <tr key={milestone.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{milestone.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{milestone.description}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 capitalize">{milestone.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      milestone.status === 'approved' ? 'bg-green-600 text-white' :
                      milestone.status === 'rejected' ? 'bg-red-600 text-white' :
                      milestone.status === 'pending_approval' ? 'bg-yellow-600 text-white' :
                      milestone.status === 'in_progress' ? 'bg-blue-600 text-white' :
                      milestone.status === 'cancelled' ? 'bg-gray-600 text-white' : 'bg-gray-600 text-white'
                    }`}>
                      {milestone.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                      milestone.priority === 'critical' ? 'bg-red-600' :
                      milestone.priority === 'high' ? 'bg-orange-600' :
                      milestone.priority === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                    }`}>
                      {milestone.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{milestone.assigned_to || '-'}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {milestone.status === 'draft' && (
                        <button
                          onClick={() => handleSubmitForApproval(milestone.id)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                        >
                          Submit
                        </button>
                      )}
                      {milestone.status === 'in_progress' && (
                        <button
                          onClick={() => handleSubmitForApproval(milestone.id)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                        >
                          Submit
                        </button>
                      )}
                      {milestone.status === 'pending_approval' && (userRole === 'supervisor' || userRole === 'admin') && (
                        <>
                          <button
                            onClick={() => handleApprove(milestone.id)}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectClick(milestone.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <MilestoneForm
          onSubmit={handleCreateMilestone}
          onCancel={() => setShowForm(false)}
          currentUser={currentUser}
        />
      )}

      {editingMilestone && (
        <MilestoneForm
          onSubmit={handleUpdateMilestone}
          onCancel={() => setEditingMilestone(null)}
          initialData={editingMilestone}
          currentUser={currentUser}
        />
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Reject Milestone</h3>
            <p className="text-gray-300 mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 mb-4"
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                  setRejectingId(null)
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MilestoneList
