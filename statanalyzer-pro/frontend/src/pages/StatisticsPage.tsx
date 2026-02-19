import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertCircle, Loader2 } from 'lucide-react'
import { getStatistics } from '../api/client'

interface StatisticsPageProps {
  dataId: string | null
}

const StatisticsPage: React.FC<StatisticsPageProps> = ({ dataId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['statistics', dataId],
    queryFn: () => getStatistics(dataId!),
    enabled: !!dataId,
  })

  // Download as JSON
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

  // Download as CSV
  const downloadCSV = () => {
    if (!data || !data.summary) return
    
    const headers = Object.keys(data.summary[0])
    const csvRows = [
      headers.join(','),
      ...data.summary.map((row: any) => 
        headers.map(header => row[header]).join(',')
      )
    ]
    
    const csvString = csvRows.join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `statistics-${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!dataId) {
    return <NoDataMessage />
  }

  if (isLoading) {
    return <LoadingState message="Computing statistics..." />
  }

  if (error) {
    return <ErrorState message="Failed to load statistics. Please try again." />
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Descriptive Statistics</h1>
        <p className="text-gray-600">
          Comprehensive statistical summary of your dataset variables.
        </p>
      </div>

      {/* Download Buttons */}
      <div className="flex justify-end gap-4 mb-6">
        <button onClick={downloadCSV} className="btn-secondary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download CSV
        </button>
        <button onClick={downloadResults} className="btn-secondary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download JSON
        </button>
      </div>

      {/* Summary Statistics Table */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary Statistics Table</h2>
        <p className="text-sm text-gray-600 mb-6">
          Key statistical measures for each numeric variable
        </p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Variable
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mean
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Std Dev
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Min
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  25%
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Median
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  75%
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Max
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.summary.map((row: any, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.index}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {row.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {row.mean?.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {row.std?.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {row.min?.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {row['25%']?.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {row['50%']?.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {row['75%']?.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {row.max?.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Box Plot */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution Analysis</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.box_plot_data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="min" fill="#3b82f6" name="Min" />
              <Bar dataKey="median" fill="#10b981" name="Median" />
              <Bar dataKey="max" fill="#ef4444" name="Max" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Histogram */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Frequency Distribution: {data.histogram_data.column}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.histogram_data.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="bin" 
                tick={{ fill: '#6b7280', fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

const NoDataMessage = () => (
  <div className="card border-l-4 border-yellow-500 bg-yellow-50">
    <div className="flex items-start">
      <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
      <div>
        <h3 className="font-semibold text-yellow-800">No Data Loaded</h3>
        <p className="text-sm text-yellow-700">Please upload a dataset to begin analysis.</p>
      </div>
    </div>
  </div>
)

const LoadingState: React.FC<{ message: string }> = ({ message }) => (
  <div className="card text-center py-12">
    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
    <p className="text-gray-600">{message}</p>
  </div>
)

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="card border-l-4 border-red-500 bg-red-50">
    <div className="flex items-start">
      <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
      <div>
        <h3 className="font-semibold text-red-800">Error</h3>
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  </div>
)

export default StatisticsPage
