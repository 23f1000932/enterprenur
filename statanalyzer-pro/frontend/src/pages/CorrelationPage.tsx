import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Loader2 } from 'lucide-react'
import { getCorrelation } from '../api/client'

interface CorrelationPageProps {
  dataId: string | null
}

const CorrelationPage: React.FC<CorrelationPageProps> = ({ dataId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['correlation', dataId],
    queryFn: () => getCorrelation(dataId!),
    enabled: !!dataId,
  })

  const downloadResults = () => {
    if (!data) return
    
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `correlation-matrix-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadCSV = () => {
    if (!data || !data.correlation_matrix) return
    
    const cols = data.columns
    const matrix = data.correlation_matrix
    
    // Create CSV header
    const csvRows = [',' + cols.join(',')]
    
    // Add each row
    cols.forEach((rowName: string) => {
      const row = cols.map((colName: string) => matrix[rowName][colName].toFixed(4))
      csvRows.push(rowName + ',' + row.join(','))
    })
    
    const csvString = csvRows.join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `correlation-matrix-${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getCorrelationColor = (value: number) => {
    if (value >= 0.7) return 'bg-green-500'
    if (value >= 0.4) return 'bg-green-300'
    if (value >= 0.1) return 'bg-green-100'
    if (value >= -0.1) return 'bg-gray-100'
    if (value >= -0.4) return 'bg-red-100'
    if (value >= -0.7) return 'bg-red-300'
    return 'bg-red-500'
  }

  const getTextColor = (value: number) => {
    const abs = Math.abs(value)
    return abs >= 0.5 ? 'text-white' : 'text-gray-900'
  }

  if (!dataId) {
    return <NoDataMessage />
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Correlation Analysis</h1>
        <p className="text-gray-600">
          Explore relationships between variables using Pearson correlation coefficients.
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

      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Correlation Matrix</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-50 border border-gray-200"></th>
                {data.columns.map((col: string) => (
                  <th key={col} className="px-4 py-2 bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.columns.map((row: string) => (
                <tr key={row}>
                  <td className="px-4 py-2 bg-gray-50 border border-gray-200 font-semibold text-sm text-gray-700">
                    {row}
                  </td>
                  {data.columns.map((col: string) => {
                    const value = data.correlation_matrix[row][col]
                    return (
                      <td
                        key={col}
                        className={`px-4 py-2 border border-gray-200 text-center font-medium text-sm ${getCorrelationColor(value)} ${getTextColor(value)}`}
                      >
                        {value.toFixed(3)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Interpretation Guide</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-1">Strong Correlation</p>
              <p className="text-gray-600">|r| ≥ 0.7</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-600">Positive</span>
                <div className="w-4 h-4 bg-red-500 rounded ml-2"></div>
                <span className="text-xs text-gray-600">Negative</span>
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Moderate Correlation</p>
              <p className="text-gray-600">0.4 ≤ |r| &lt; 0.7</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-4 h-4 bg-green-300 rounded"></div>
                <span className="text-xs text-gray-600">Positive</span>
                <div className="w-4 h-4 bg-red-300 rounded ml-2"></div>
                <span className="text-xs text-gray-600">Negative</span>
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Weak/No Correlation</p>
              <p className="text-gray-600">|r| &lt; 0.4</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-4 h-4 bg-gray-100 rounded border border-gray-300"></div>
                <span className="text-xs text-gray-600">Minimal</span>
              </div>
            </div>
          </div>
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

const LoadingState = () => (
  <div className="card text-center py-12">
    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
    <p className="text-gray-600">Computing correlations...</p>
  </div>
)

const ErrorState = () => (
  <div className="card border-l-4 border-red-500 bg-red-50">
    <div className="flex items-start">
      <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
      <div>
        <h3 className="font-semibold text-red-800">Error</h3>
        <p className="text-sm text-red-700">Failed to load correlation data. Please try again.</p>
      </div>
    </div>
  </div>
)

export default CorrelationPage
