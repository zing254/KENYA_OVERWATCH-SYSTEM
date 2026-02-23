'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import { 
  Brain, 
  Cpu, 
  Database, 
  Activity, 
  TrendingUp,
  Play,
  Pause,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  FileText,
  Image,
  Video,
  Zap,
  Target,
  Gauge,
  Layers,
  RefreshCw,
  ChevronRight,
  Eye,
  TrainTrack
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Model {
  id: string
  name: string
  type: string
  status: 'training' | 'ready' | 'error'
  accuracy: number
  last_trained: string
  dataset_size: number
  epochs: number
}

interface Dataset {
  id: string
  name: string
  type: 'images' | 'videos' | 'annotations'
  size: number
  samples: number
  last_updated: string
}

interface TrainingJob {
  id: string
  model: string
  status: 'running' | 'completed' | 'failed'
  progress: number
  started_at: string
  estimated_time: string
}

export default function AITrainingDashboard() {
  const [models, setModels] = useState<Model[]>([])
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [modelsRes, aiStatusRes] = await Promise.all([
        fetch(`${API_URL}/api/ai/models`),
        fetch(`${API_URL}/api/ai/status`)
      ])
      
      const aiStatus = await aiStatusRes.json()
      
      const mockModels: Model[] = [
        { id: 'person_detector', name: 'Person Detector', type: 'detection', status: 'ready', accuracy: 94.5, last_trained: '2026-02-20', dataset_size: 45000, epochs: 150 },
        { id: 'vehicle_detector', name: 'Vehicle Detector', type: 'detection', status: 'ready', accuracy: 96.2, last_trained: '2026-02-18', dataset_size: 62000, epochs: 200 },
        { id: 'weapon_detector', name: 'Weapon Detector', type: 'detection', status: 'training', accuracy: 78.3, last_trained: '2026-02-23', dataset_size: 12000, epochs: 45 },
        { id: 'anpr_model', name: 'License Plate Reader', type: 'ocr', status: 'ready', accuracy: 98.7, last_trained: '2026-02-15', dataset_size: 85000, epochs: 300 },
        { id: 'behavior_analyzer', name: 'Behavior Analyzer', type: 'classification', status: 'ready', accuracy: 89.1, last_trained: '2026-02-10', dataset_size: 35000, epochs: 180 },
        { id: 'incident_classifier', name: 'Incident Classifier', type: 'classification', status: 'training', accuracy: 82.4, last_trained: '2026-02-23', dataset_size: 28000, epochs: 67 },
      ]

      const mockDatasets: Dataset[] = [
        { id: 'kenya_persons', name: 'Kenya Persons', type: 'images', size: 2.4, samples: 45000, last_updated: '2026-02-20' },
        { id: 'kenya_vehicles', name: 'Kenya Vehicles', type: 'images', size: 4.8, samples: 62000, last_updated: '2026-02-18' },
        { id: 'weapon_images', name: 'Weapons Dataset', type: 'images', size: 1.2, samples: 12000, last_updated: '2026-02-23' },
        { id: 'license_plates', name: 'Kenya Plates', type: 'images', size: 6.1, samples: 85000, last_updated: '2026-02-15' },
        { id: 'behavior_data', name: 'Behavior Samples', type: 'annotations', size: 0.8, samples: 35000, last_updated: '2026-02-10' },
        { id: 'incident_data', name: 'Incidents', type: 'annotations', size: 0.5, samples: 28000, last_updated: '2026-02-23' },
      ]

      const mockJobs: TrainingJob[] = [
        { id: 'job_001', model: 'Weapon Detector', status: 'running', progress: 67, started_at: '2026-02-23 10:00', estimated_time: '2h 15m' },
        { id: 'job_002', model: 'Incident Classifier', status: 'running', progress: 34, started_at: '2026-02-23 08:30', estimated_time: '4h 45m' },
        { id: 'job_003', model: 'Person Detector', status: 'completed', progress: 100, started_at: '2026-02-20 14:00', estimated_time: '3h 20m' },
      ]

      setModels(mockModels)
      setDatasets(mockDatasets)
      setTrainingJobs(mockJobs)
    } catch (error) {
      console.error('Error fetching AI data:', error)
    }
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500'
      case 'training': return 'bg-blue-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-400'
    if (accuracy >= 85) return 'text-blue-400'
    if (accuracy >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const overallAccuracy = models.filter(m => m.status === 'ready').reduce((acc, m) => acc + m.accuracy, 0) / models.filter(m => m.status === 'ready').length || 0
  const totalSamples = datasets.reduce((acc, d) => acc + d.samples, 0)
  const activeTraining = trainingJobs.filter(j => j.status === 'running').length

  return (
    <>
      <Head>
        <title>AI Training - Kenya Overwatch</title>
      </Head>
      
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Model Training Center</h1>
                <p className="text-gray-400 text-sm">Kenya Overwatch AI Training Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-lg">
                <Gauge className="w-5 h-5 text-blue-400" />
                <span className="text-sm">System Status:</span>
                <span className="text-green-400 font-semibold">Online</span>
              </div>
              <button onClick={fetchData} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Models</p>
                <p className="text-3xl font-bold">{models.length}</p>
              </div>
              <Brain className="w-10 h-10 text-blue-500" />
            </div>
            <div className="mt-3 flex gap-2">
              <span className="text-green-400 text-sm">{models.filter(m => m.status === 'ready').length} Ready</span>
              <span className="text-blue-400 text-sm">{models.filter(m => m.status === 'training').length} Training</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Accuracy</p>
                <p className={`text-3xl font-bold ${getAccuracyColor(overallAccuracy)}`}>
                  {overallAccuracy.toFixed(1)}%
                </p>
              </div>
              <Target className="w-10 h-10 text-green-500" />
            </div>
            <div className="mt-3">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-green-500" style={{ width: `${overallAccuracy}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Training Data</p>
                <p className="text-3xl font-bold">{(totalSamples / 1000).toFixed(0)}K</p>
              </div>
              <Database className="w-10 h-10 text-purple-500" />
            </div>
            <div className="mt-3 flex gap-2">
              <span className="text-gray-400 text-sm">{datasets.length} Datasets</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Training</p>
                <p className="text-3xl font-bold">{activeTraining}</p>
              </div>
              <Activity className="w-10 h-10 text-orange-500" />
            </div>
            <div className="mt-3">
              <span className="text-orange-400 text-sm">{trainingJobs.filter(j => j.status === 'running').length} Jobs Running</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-4">
          <div className="flex gap-2 border-b border-gray-700">
            {['overview', 'models', 'datasets', 'training', 'metrics'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 -mb-px border-b-2 capitalize ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Models Status */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-400" />
                  AI Models Status
                </h3>
                <div className="space-y-3">
                  {models.slice(0, 5).map(model => (
                    <div key={model.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(model.status)}`} />
                        <div>
                          <p className="font-medium">{model.name}</p>
                          <p className="text-xs text-gray-400">{model.type} • {model.epochs} epochs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getAccuracyColor(model.accuracy)}`}>{model.accuracy}%</p>
                        <p className="text-xs text-gray-400">{model.last_trained}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Training Jobs */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrainTrack className="w-5 h-5 text-orange-400" />
                  Training Jobs
                </h3>
                <div className="space-y-3">
                  {trainingJobs.map(job => (
                    <div key={job.id} className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {job.status === 'running' ? (
                            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                          ) : job.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="font-medium">{job.model}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${job.status === 'running' ? 'bg-blue-900 text-blue-400' : job.status === 'completed' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                          {job.status}
                        </span>
                      </div>
                      {job.status === 'running' && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress: {job.progress}%</span>
                            <span>ETA: {job.estimated_time}</span>
                          </div>
                          <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${job.progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg flex flex-col items-center gap-2 transition">
                    <Play className="w-6 h-6" />
                    <span className="text-sm font-medium">Start Training</span>
                  </button>
                  <button className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg flex flex-col items-center gap-2 transition">
                    <Database className="w-6 h-6" />
                    <span className="text-sm font-medium">Upload Dataset</span>
                  </button>
                  <button className="p-4 bg-green-600 hover:bg-green-700 rounded-lg flex flex-col items-center gap-2 transition">
                    <Gauge className="w-6 h-6" />
                    <span className="text-sm font-medium">Run Benchmark</span>
                  </button>
                  <button className="p-4 bg-orange-600 hover:bg-orange-700 rounded-lg flex flex-col items-center gap-2 transition">
                    <Settings className="w-6 h-6" />
                    <span className="text-sm font-medium">Model Settings</span>
                  </button>
                </div>
              </div>

              {/* Model Performance */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Performance by Model Type
                </h3>
                <div className="space-y-4">
                  {['detection', 'ocr', 'classification'].map(type => {
                    const typeModels = models.filter(m => m.type === type && m.status === 'ready')
                    const avgAcc = typeModels.length ? typeModels.reduce((a, m) => a + m.accuracy, 0) / typeModels.length : 0
                    return (
                      <div key={type}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{type} Models</span>
                          <span className={getAccuracyColor(avgAcc)}>{avgAcc.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500" 
                            style={{ width: `${avgAcc}%` }} 
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map(model => (
                <div key={model.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(model.status)}`} />
                      <h4 className="font-semibold">{model.name}</h4>
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{model.type}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Accuracy</span>
                      <span className={`font-bold ${getAccuracyColor(model.accuracy)}`}>{model.accuracy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dataset Size</span>
                      <span>{model.dataset_size.toLocaleString()} samples</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Epochs</span>
                      <span>{model.epochs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Trained</span>
                      <span>{model.last_trained}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">
                      Retrain
                    </button>
                    <button className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium">
                      Configure
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'datasets' && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left p-4">Dataset Name</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-right p-4">Size (GB)</th>
                    <th className="text-right p-4">Samples</th>
                    <th className="text-right p-4">Last Updated</th>
                    <th className="text-center p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map(dataset => (
                    <tr key={dataset.id} className="border-t border-gray-700 hover:bg-gray-750">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {dataset.type === 'images' ? <Image className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-purple-400" />}
                          <span className="font-medium">{dataset.name}</span>
                        </div>
                      </td>
                      <td className="p-4 capitalize">{dataset.type}</td>
                      <td className="p-4 text-right">{dataset.size}</td>
                      <td className="p-4 text-right">{dataset.samples.toLocaleString()}</td>
                      <td className="p-4 text-right">{dataset.last_updated}</td>
                      <td className="p-4 text-center">
                        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'training' && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Start New Training Job</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Select Model</label>
                    <select className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600">
                      <option>Person Detector</option>
                      <option>Vehicle Detector</option>
                      <option>Weapon Detector</option>
                      <option>License Plate Reader</option>
                      <option>Behavior Analyzer</option>
                      <option>Incident Classifier</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Dataset</label>
                    <select className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600">
                      {datasets.map(d => (
                        <option key={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Epochs</label>
                    <input type="number" defaultValue={100} className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600" />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Start Training
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Training Queue</h3>
                <div className="space-y-3">
                  {trainingJobs.map(job => (
                    <div key={job.id} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {job.status === 'running' ? (
                            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                          ) : job.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                          <div>
                            <p className="font-medium">{job.model}</p>
                            <p className="text-xs text-gray-400">Started: {job.started_at}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${job.status === 'running' ? 'text-blue-400' : job.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>
                            {job.status === 'running' ? `${job.progress}%` : job.status}
                          </p>
                          {job.status === 'running' && (
                            <p className="text-xs text-gray-400">ETA: {job.estimated_time}</p>
                          )}
                        </div>
                      </div>
                      {job.status === 'running' && (
                        <div className="mt-3">
                          <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all" style={{ width: `${job.progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Model Accuracy Over Time
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  [Training Accuracy Chart would be displayed here]
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Training Progress
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  [Training Progress Chart would be displayed here]
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  Dataset Distribution
                </h3>
                <div className="space-y-3">
                  {datasets.map(d => (
                    <div key={d.id} className="flex items-center gap-3">
                      <span className="w-32 text-sm truncate">{d.name}</span>
                      <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(d.samples / totalSamples * 100)}%` }} 
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-16 text-right">
                        {((d.samples / totalSamples) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-orange-400" />
                  System Resources
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>GPU Usage</span>
                      <span>78%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-yellow-500" style={{ width: '78%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>62%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: '62%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Disk I/O</span>
                      <span>45%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: '45%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
