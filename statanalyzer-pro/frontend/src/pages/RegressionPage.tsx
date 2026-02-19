import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertCircle, Loader2 } from 'lucide-react'
import { runRegression } from '../api/client'

interface RegressionPageProps {
  dataId: string | null
  dataInfo: any
}

const RegressionPage: React.FC<RegressionPageProps> = ({ dataId, dataInfo }) => {
  const [yColumn, setYColumn] = useState('')
  const [xColumn, setXColumn] = useState('')

  const mutation = useMutation({
    mutationFn: (data: { data_id: string; y_column: string; x_column: string }) =>
      runRegression(data),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dataId || !yColumn || !xColumn) return

    mutation.mutate({
      data_id: dataId,
      y_column: yColumn,
      x_column: xColumn,
    })
  }

  const downloadResults = () => {
    if (!mutation.data) return
    
    const dataStr = JSON.stringify(mutation.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `regression-results-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!dataId) {
    return <NoDataMessage />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Regression Analysis</h1>
        <p className="text-gray-600">
          Model the relationship between variables using linear regression.
        </p>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Model Configuration</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label">Dependent Variable (Y)</label>
              <select
                value={yColumn}
                onChange={(e) => setYColumn(e.target.value)}
                className="input"
                required
              >
                <option value="">Select Y variable</option>
                {dataInfo?.numeric_columns?.map((col: string) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Independent Variable (X)</label>
              <select
                value={xColumn}
                onChange={(e) => setXColumn(e.target.value)}
                className="input"
                required
              >
                <option value="">Select X variable</option>
                {dataInfo?.numeric_columns?.map((col: string) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                Computing Regression...
              </>
            ) : (
              'Run Regression'
            )}
          </button>
        </form>
      </div>

      {mutation.isError && (
        <div className="card border-l-4 border-red-500 bg-red-50 mb-8">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Analysis Failed</h3>
              <p className="text-sm text-red-700">
                {(mutation.error as any)?.response?.data?.detail || 'An error occurred.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {mutation.isSuccess && mutation.data && (
        <div className="space-y-8">
          {/* Download Button */}
          <div className="flex justify-end">
            <button onClick={downloadResults} className="btn-secondary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Results
            </button>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Model Statistics</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">R-squared</p>
                <p className="text-3xl font-bold text-blue-600">
                  {mutation.data.model_stats.r_squared.toFixed(4)}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  {(mutation.data.model_stats.r_squared * 100).toFixed(2)}% of variance explained
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Adjusted R-squared</p>
                <p className="text-3xl font-bold text-purple-600">
                  {mutation.data.model_stats.adj_r_squared.toFixed(4)}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">F-statistic</p>
                <p className="text-2xl font-bold text-green-600">
                  {mutation.data.model_stats.f_statistic.toFixed(4)}
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">p-value</p>
                <p className="text-2xl font-bold text-orange-600">
                  {mutation.data.model_stats.p_value.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Regression Equation</h4>
              <p className="text-lg font-mono text-gray-700">{mutation.data.equation}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scatter Plot with Regression Line</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="x" type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis dataKey="y" type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Scatter data={mutation.data.scatter_data} fill="#3b82f6" />
                  <Line data={mutation.data.regression_line} type="monotone" dataKey="y" stroke="#ef4444" strokeWidth={2} dot={false} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Residual Plot</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="fitted" type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis dataKey="residual" type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Scatter data={mutation.data.residual_data} fill="#10b981" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
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

export default RegressionPage
