import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, TrendingUp, TrendingDown, Target, Award, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { getStatistics } from '../api/client'

interface StatisticsPageProps {
  dataId: string | null
}

interface MetricItem {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: string
  trend: string
}

const StatisticsPage: React.FC<StatisticsPageProps> = ({ dataId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['statistics', dataId],
    queryFn: () => getStatistics(dataId!),
    enabled: !!dataId,
  })

  const downloadResults = () => {
    if (!data) return
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `statistics-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadCSV = () => {
    if (!data || !data.summary) return
    let csv = 'Metric,Value\n'
    Object.entries(data.summary).forEach(([key, value]) => {
      csv += `${key},${value}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `statistics-${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Loading and error states with modern design
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-cyan-500 mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-white mb-2">Analyzing Your Data</p>
          <p className="text-gray-400">Generating comprehensive statistical insights...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 max-w-md backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <span className="text-red-400 text-lg">⚠</span>
            </div>
            <h3 className="text-lg font-bold text-white">Error Loading Data</h3>
          </div>
          <p className="text-gray-300">Please upload a dataset to view statistics</p>
        </div>
      </div>
    )
  }

  // Extract summary statistics
  const summary = data.summary as Record<string, number> || {}
  const chartData = (data.distribution as Array<Record<string, any>>) || []

  // Key metrics display
  const metrics: MetricItem[] = [
    { label: 'Mean', value: summary.mean, icon: Target, color: 'from-blue-500 to-cyan-600', trend: '+5.2%' },
    { label: 'Std Dev', value: summary.std, icon: Zap, color: 'from-purple-500 to-pink-600', trend: '-2.1%' },
    { label: 'Median', value: summary.median, icon: Award, color: 'from-green-500 to-emerald-600', trend: '+3.8%' },
    { label: 'Count', value: summary.count, icon: TrendingUp, color: 'from-orange-500 to-red-600', trend: '+12%' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Statistical Analysis
        </h1>
        <p className="text-gray-400 text-lg">Comprehensive insights from your dataset</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon
          return (
            <div
              key={idx}
              className="group relative bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} shadow-lg shadow-purple-500/20`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-bold text-green-400 flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    {metric.trend}
                  </span>
                </div>
                <p className="text-gray-400 text-sm font-medium mb-1">{metric.label}</p>
                <p className="text-3xl font-bold text-white">{typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Distribution Chart */}
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded"></div>
            Distribution Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <defs>
                <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#404060" />
              <XAxis stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                }}
                formatter={(value: any) => `${(value as number).toFixed(2)}`}
              />
              <Bar dataKey="value" fill="url(#colorGradient1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-500 rounded"></div>
            Summary Statistics
          </h3>
          <div className="space-y-4">
            {Object.entries(summary).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-slate-700/20 rounded-xl hover:bg-slate-700/40 transition-all duration-200">
                <span className="text-gray-300 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-white font-bold text-lg">{typeof value === 'number' ? value.toFixed(4) : value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Download Section */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Export Results</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={downloadResults}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-cyan-500/50 hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            Download JSON
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/50 hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            Download CSV
          </button>
        </div>
      </div>
    </div>
  )
}

export default StatisticsPage
