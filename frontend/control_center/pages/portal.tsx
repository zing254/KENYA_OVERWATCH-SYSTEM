import Layout from '@/components/Layout'
import { useState } from 'react'
import { FileText, Search, Upload, Clock, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react'

interface Appeal {
  id: string
  caseNumber: string
  status: 'pending' | 'approved' | 'rejected'
  submittedDate: string
  description: string
}

export default function CitizenPortal() {
  const [activeTab, setActiveTab] = useState<'status' | 'appeal'>('status')
  const [searchCase, setSearchCase] = useState('')
  const [appealForm, setAppealForm] = useState({
    caseNumber: '',
    citizenId: '',
    reason: '',
    evidence: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const mockAppeals: Appeal[] = [
    {
      id: 'app_001',
      caseNumber: 'INC-2024-00123',
      status: 'pending',
      submittedDate: '2024-02-15',
      description: 'Traffic signal violation appeal'
    },
    {
      id: 'app_002',
      caseNumber: 'INC-2024-00089',
      status: 'approved',
      submittedDate: '2024-02-10',
      description: 'Wrongful parking penalty'
    }
  ]

  const handleSubmitAppeal = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <Layout title="Kenya Overwatch - Citizen Portal">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-white" />
              <h1 className="text-2xl font-bold text-white">Citizen Portal</h1>
            </div>
            <p className="text-green-100">
              View case status, submit appeals, and access redacted evidence
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('status')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                activeTab === 'status'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Search className="w-4 h-4" />
              Check Case Status
            </button>
            <button
              onClick={() => setActiveTab('appeal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                activeTab === 'appeal'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Submit Appeal
            </button>
          </div>

          {/* Check Case Status */}
          {activeTab === 'status' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Check Your Case Status
              </h2>
              
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Enter case number (e.g., INC-2024-00123)"
                  value={searchCase}
                  onChange={(e) => setSearchCase(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                  Search
                </button>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Appeals</h3>
                <div className="space-y-3">
                  {mockAppeals.map(appeal => (
                    <div key={appeal.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{appeal.caseNumber}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${
                              appeal.status === 'approved' ? 'bg-green-100 text-green-700' :
                              appeal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {appeal.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                              {appeal.status === 'rejected' && <XCircle className="w-3 h-3" />}
                              {appeal.status === 'pending' && <Clock className="w-3 h-3" />}
                              {appeal.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{appeal.description}</p>
                          <p className="text-gray-400 text-xs mt-2">
                            Submitted: {appeal.submittedDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Appeal */}
          {activeTab === 'appeal' && (
            <div className="bg-white rounded-lg shadow p-6">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Appeal Submitted Successfully!
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Your appeal has been received and is being reviewed.
                  </p>
                  <p className="text-gray-500 text-sm">
                    Reference Number: APP-{Date.now().toString(36).toUpperCase()}
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    Submit Another Appeal
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Submit an Appeal
                  </h2>
                  <form onSubmit={handleSubmitAppeal} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Case Number
                      </label>
                      <input
                        type="text"
                        required
                        value={appealForm.caseNumber}
                        onChange={(e) => setAppealForm({...appealForm, caseNumber: e.target.value})}
                        placeholder="e.g., INC-2024-00123"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Citizen ID / Phone Number
                      </label>
                      <input
                        type="text"
                        required
                        value={appealForm.citizenId}
                        onChange={(e) => setAppealForm({...appealForm, citizenId: e.target.value})}
                        placeholder="Your registered ID or phone"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Appeal
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={appealForm.reason}
                        onChange={(e) => setAppealForm({...appealForm, reason: e.target.value})}
                        placeholder="Explain why you are appealing this case..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supporting Evidence (Optional)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">
                          Drag and drop files here, or click to browse
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          PDF, JPG, PNG up to 10MB
                        </p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium">Important Notice</p>
                          <p className="mt-1">
                            Appeals must be submitted within 30 days of receiving the notice. 
                            Providing false information is a criminal offense under Kenyan law.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                    >
                      Submit Appeal
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Need Help?</h3>
            <p className="text-blue-700 text-sm">
              For assistance with your case, contact the Overwatch Support Center:
            </p>
            <ul className="text-blue-700 text-sm mt-2 space-y-1">
              <li>• Email: support@overwatch.go.ke</li>
              <li>• Phone: +254-XXX-XXXXXX (Mon-Fri, 8am-5pm)</li>
              <li>• Visit: Nearest Police Station</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}
