import React, { useState } from 'react'
import { Milestone, MilestoneType, Priority } from '@/types'
import { X } from 'lucide-react'

interface MilestoneFormProps {
  onSubmit: (milestone: Partial<Milestone>) => void
  onCancel: () => void
  initialData?: Partial<Milestone>
  currentUser: string
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'development' as MilestoneType,
    priority: initialData?.priority || 'medium' as Priority,
    assigned_to: initialData?.assigned_to || '',
    due_date: initialData?.due_date ? initialData.due_date.split('T')[0] : '',
    linked_incident_id: initialData?.linked_incident_id || '',
    linked_evidence_id: initialData?.linked_evidence_id || '',
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const milestoneData = {
      ...formData,
      created_by: currentUser,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
      linked_incident_id: formData.linked_incident_id || undefined,
      linked_evidence_id: formData.linked_evidence_id || undefined,
    }

    try {
      await onSubmit(milestoneData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {initialData?.id ? 'Edit Milestone' : 'Create New Milestone'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter milestone title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter milestone description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as MilestoneType })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="development">Development</option>
                <option value="incident_case">Incident Case</option>
                <option value="evidence_review">Evidence Review</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Assigned To
            </label>
            <input
              type="text"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter assignee username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {formData.type === 'incident_case' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Linked Incident ID
              </label>
              <input
                type="text"
                value={formData.linked_incident_id}
                onChange={(e) => setFormData({ ...formData, linked_incident_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., inc_001"
              />
            </div>
          )}

          {formData.type === 'evidence_review' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Linked Evidence ID
              </label>
              <input
                type="text"
                value={formData.linked_evidence_id}
                onChange={(e) => setFormData({ ...formData, linked_evidence_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., ev_001"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
            >
              {loading ? 'Creating...' : initialData?.id ? 'Update Milestone' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MilestoneForm
