import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ScatterChart, Scatter, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { runNormalityTest } from '../api/client'

interface NormalityPageProps {
  dataId: string | null
  dataInfo: any
}

const NormalityPage: React.FC<NormalityPageProps> = ({ dataId, dataInfo }) => {
  const [column, setColumn] = useState('')
  const [alpha, setAlpha] = useState('0.05')

  const mutation = useMutation({
    mutationFn: (data: { data_id: string; column: string; alpha: number }) =>
      runNormalityTest(data),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dataId || !column) return

    mutation.mutate({
      data_id: dataId,
      column,
      alpha: parseFloat(alpha),
    })
  }

  const downloadResults = () => {
    if (!mutation.data) return
    
    const dataStr = JSON.stringify(mutation.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `normality-test-${Date.now()}.json`
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Normality Tests</h1>
        <p className="text-gray-600">
          Assess whether your data follows a normal distribution using multiple statistical tests.
        </p>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Test Configuration</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label">Select Variable</label>
              <select
                value={column}
                onChange={(e) => setColumn(e.target.value)}
                className="input"
                required
              >
                <option value="">Choose variable to test</option>
                {dataInfo?.numeric_columns?.map((col: string) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Significance Level (α)</label>
              <select
                value={alpha}
                onChange={(e) => setAlpha(e.target.value)}
                className="input"
              >
                <option value="0.01">α = 0.01</option>
                <option value="0.05">α = 0.05</option>
                <option value="0.10">α = 0.10</option>
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
                Running Tests...
              </>
            ) : (
              'Run Normality Tests'
            )}
          </button>
        </form>
      </div>

      {mutation.isError && (
        <div className="card border-l-4 border-red-500 bg-red-50 mb-8">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Test Failed</h3>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Test Results</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Test</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Statistic</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">p-value</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Result</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Shapiro-Wilk
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      {mutation.data.tests.shapiro_wilk.statistic.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      {mutation.data.tests.shapiro_wilk.p_value.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {mutation.data.tests.shapiro_wilk.result === 'normal' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Normal
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <XCircle className="w-4 h-4 mr-1" />
                          Not Normal
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Kolmogorov-Smirnov
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      {mutation.data.tests.kolmogorov_smirnov.statistic.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      {mutation.data.tests.kolmogorov_smirnov.p_value.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {mutation.data.tests.kolmogorov_smirnov.result === 'normal' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Normal
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <XCircle className="w-4 h-4 mr-1" />
                          Not Normal
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Anderson-Darling
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      {mutation.data.tests.anderson_darling.statistic.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      See critical values
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      See interpretation
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Interpretation</h4>
              <p className="text-sm text-blue-800">
                At α = {alpha}, the data {
                  mutation.data.tests.shapiro_wilk.result === 'normal' && 
                  mutation.data.tests.kolmogorov_smirnov.result === 'normal'
                    ? 'appears to be normally distributed'
                    : 'does not appear to be normally distributed'
                } based on the Shapiro-Wilk and Kolmogorov-Smirnov tests.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Anderson-Darling statistic: {mutation.data.tests.anderson_darling.statistic.toFixed(4)}
              </p>
              <p className="text-sm text-blue-700">
                Critical values: {mutation.data.tests.anderson_darling.critical_values.map((v: number) => v.toFixed(3)).join(', ')}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Q-Q Plot (Quantile-Quantile)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="theoretical" 
                    type="number" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Theoretical Quantiles', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="sample" 
                    type="number" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Sample Quantiles', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Scatter data={mutation.data.qq_plot_data} fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-600 mt-2">
                Points should follow a straight line if data is normally distributed
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution vs Normal Curve</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Line 
                    data={mutation.data.normal_curve_data} 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Normal Curve"
                    dot={false}
                  />
                </LineChart>
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

export default NormalityPage
