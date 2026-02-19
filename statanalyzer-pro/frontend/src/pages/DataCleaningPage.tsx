import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { AlertCircle, CheckCircle, Zap, Settings, Eye, EyeOff, Download, RefreshCw, Sparkles } from 'lucide-react'
import { api } from '../api/client'

interface DataCleaningPageProps {
  dataId: string | null
  setDataId: (id: string) => void
  setdDtaInfo: (info: Record<string, any>) => void
   dataInfo?: any
}

const DataCleaningPage: React.FC<DataCleaningPageProps> = ({ dataId, setDataId, setDataInfo, dataInfo }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('fill_mean')
  const [selectedOutlier, setSelectedOutlier] = useState<string>('iqr')
  const [selectedScaling, setSelectedScaling] = useState<string>('standardize')
  const [previewVisible, setPreviewVisible] = useState<boolean>(false)

  const cleaningStrategies = [
    { value: 'fill_mean', label: 'Mean Imputation', description: 'Fill missing values with mean', icon: '📊' },
    { value: 'fill_median', label: 'Median Imputation', description: 'Fill with median values', icon: '📈' },
    { value: 'fill_mode', label: 'Mode Imputation', description: 'Fill with most frequent value', icon: '🎯' },
    { value: 'drop_missing', label: 'Drop Missing', description: 'Remove rows with missing data', icon: '🗑️' },
  ]

  const outlierStrategies = [
    { value: 'iqr', label: 'IQR Method', description: 'Interquartile Range detection', icon: '📍' },
    { value: 'zscore', label: 'Z-score Method', description: 'Statistical z-score approach', icon: '📐' },
  ]

  const scalingStrategies = [
    { value: 'standardize', label: 'Standardization', description: 'Zero mean, unit variance', icon: '⚙️' },
    { value: 'normalize', label: 'Normalization', description: '0-1 range scaling', icon: '📏' },
    { value: 'log', label: 'Log Transform', description: 'Log-scale transformation', icon: '📉' },
  ]

  const { data: previewData } = useQuery({
    queryKey: ['cleaning_preview', dataId, selectedStrategy, selectedOutlier, selectedScaling],
    queryFn: async () => {
      if (!dataId) return null
      const response = await api.post('/clean-preview', {
        data_id: dataId,
        strategy: selectedStrategy,
        outlier_method: selectedOutlier,
        scaling: selectedScaling,
      })
      return response.data
    },
    enabled: !!dataId && previewVisible,
  })

  const cleanMutation = useMutation({
    mutationFn: async () => {
      if (!dataId) return
      const response = await api.post('/clean-data', {
        data_id: dataId,
        strategy: selectedStrategy,
        outlier_method: selectedOutlier,
        scaling: selectedScaling,
      })
      return response.data
    },
    onSuccess: (data: any) => {
      setDataId(data.id)
      setdataInfo(data.info)
    },
  })

  if (!dataId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/50">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Data Cleaning</h2>
          <p className="text-gray-400 text-lg">Upload a dataset first to begin the cleaning process</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Advanced Data Cleaning
        </h1>
        <p className="text-gray-400 text-lg">Configure strategies for data preprocessing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Missing Values Strategy */}
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-500 rounded"></div>
              Missing Values Handling
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cleaningStrategies.map((strategy) => (
                <button
                  key={strategy.value}
                  onClick={() => setSelectedStrategy(strategy.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedStrategy === strategy.value
                      ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/30'
                      : 'bg-slate-700/20 border-slate-600/50 hover:border-blue-500/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{strategy.icon}</div>
                  <p className="font-semibold text-white text-sm">{strategy.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{strategy.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Outlier Detection */}
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-500 rounded"></div>
              Outlier Detection
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {outlierStrategies.map((strategy) => (
                <button
                  key={strategy.value}
                  onClick={() => setSelectedOutlier(strategy.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedOutlier === strategy.value
                      ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/30'
                      : 'bg-slate-700/20 border-slate-600/50 hover:border-purple-500/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{strategy.icon}</div>
                  <p className="font-semibold text-white text-sm">{strategy.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{strategy.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Scaling */}
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-emerald-500 rounded"></div>
              Data Scaling
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {scalingStrategies.map((strategy) => (
                <button
                  key={strategy.value}
                  onClick={() => setSelectedScaling(strategy.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedScaling === strategy.value
                      ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/30'
                      : 'bg-slate-700/20 border-slate-600/50 hover:border-green-500/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{strategy.icon}</div>
                  <p className="font-semibold text-white text-sm">{strategy.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{strategy.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          {/* Preview Button */}
          <button
            onClick={() => setPreviewVisible(!previewVisible)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-slate-700 hover:to-slate-600 text-white font-semibold rounded-xl border border-slate-600/50 transition-all duration-200"
          >
            {previewVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            {previewVisible ? 'Hide Preview' : 'Show Preview'}
          </button>

          {/* Preview Box */}
          {previewVisible && previewData && (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/30 backdrop-blur-xl border border-slate-600/50 rounded-xl p-4 max-h-48 overflow-auto">
              <p className="text-xs text-gray-400 font-mono">{JSON.stringify(previewData, null, 2).slice(0, 200)}...</p>
            </div>
          )}

          {/* Apply Cleaning Button */}
          <button
            onClick={() => cleanMutation.mutate()}
            disabled={cleanMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/50 hover:shadow-xl"
          >
            {cleanMutation.isPending ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            {cleanMutation.isPending ? 'Processing...' : 'Apply Cleaning'}
          </button>

          {/* Success Message */}
          {cleanMutation.isSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Data cleaned successfully!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DataCleaningPage
