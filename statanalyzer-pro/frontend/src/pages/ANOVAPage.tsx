import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { runANOVA } from '../api/client'

interface ANOVAPageProps {
  dataId: string | null
  dataInfo: any
}

const ANOVAPage: React.FC<ANOVAPageProps> = ({ dataId, dataInfo }) => {
  const [valueColumn, setValueColumn] = useState('')
  const [groupColumn, setGroupColumn] = useState('')

  const mutation = useMutation({
    mutationFn: (data: { data_id: string; value_column: string; group_column: string }) =>
      runANOVA(data),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dataId || !valueColumn || !groupColumn) return

    mutation.mutate({
      data_id: dataId,
      value_column: valueColumn,
      group_column: groupColumn,
    })
  }

  const downloadResults = () => {
    if (!mutation.data) return
    
    const dataStr = JSON.stringify(mutation.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `anova-results-${Date.now()}.json`
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Analysis of Variance (ANOVA)
        </h1>
        <p className="text-gray-600">
          Compare means across multiple groups to identify significant differences.
        </p>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">ANOVA Configuration</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Value Column */}
            <div>
              <label className="label">Value Column (Dependent Variable)</label>
              <select
                value={valueColumn}
                onChange={(e) => setValueColumn(e.target.value)}
                className="input"
                required
              >
                <option value="">Select value column</option>
                {dataInfo?.numeric_columns?.map((col: string) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Group Column - FIXED: Show ALL columns */}
            <div>
              <label className="label">Group Column (Factor)</label>
              <select
                value={groupColumn}
                onChange={(e) => setGroupColumn(e.target.value)}
                className="input"
                required
              >
                <option value="">Select grouping variable</option>
                {/* Show numeric columns */}
                {dataInfo?.numeric_columns?.map((col: string) => (
                  <option key={col} value={col}>{col}</option>
                ))}
                {/* Show categorical columns */}
                {dataInfo?.categorical_columns?.map((col: string) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                💡 For numeric columns, values will be treated as group labels
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !valueColumn || !groupColumn}
            className="btn-primary"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                Running ANOVA...
              </>
            ) : (
              'Run ANOVA'
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
                {(mutation.error as any)?.response?.data?.detail || 'An error occurred during ANOVA analysis.'}
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

          {/* ANOVA Results */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ANOVA Results</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">F-Statistic</p>
                <p className="text-3xl font-bold text-blue-600">
                  {mutation.data.f_statistic.toFixed(4)}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">p-value</p>
                <p className="text-3xl font-bold text-purple-600">
                  {mutation.data.p_value.toFixed(6)}
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg border-l-4 ${
              mutation.data.decision === 'significant' 
                ? 'bg-green-50 border-green-500' 
                : 'bg-yellow-50 border-yellow-500'
            }`}>
              <div className="flex items-start">
                <CheckCircle className={`w-5 h-5 mr-3 mt-0.5 ${
                  mutation.data.decision === 'significant' ? 'text-green-600' : 'text-yellow-600'
                }`} />
                <div>
                  <h3 className={`font-semibold ${
                    mutation.data.decision === 'significant' ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {mutation.data.decision === 'significant' 
                      ? 'Significant Difference Detected' 
                      : 'No Significant Difference'}
                  </h3>
                  <p className={`text-sm ${
                    mutation.data.decision === 'significant' ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {mutation.data.decision === 'significant'
                      ? `At α = 0.05, there is a statistically significant difference between groups (p = ${mutation.data.p_value.toFixed(6)}).`
                      : `At α = 0.05, there is no statistically significant difference between groups (p = ${mutation.data.p_value.toFixed(6)}).`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Group Statistics */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Statistics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Group
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Count
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Mean
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Std Dev
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Min
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Max
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mutation.data.group_statistics.map((group: any, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {group[groupColumn]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                        {group.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                        {group.mean?.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                        {group.std?.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                        {group.min?.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                        {group.max?.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Box Plot */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribution by Group
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={mutation.data.box_plot_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="group" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="min" fill="#3b82f6" name="Min" />
                <Bar dataKey="median" fill="#10b981" name="Median" />
                <Bar dataKey="max" fill="#ef4444" name="Max" />
              </BarChart>
            </ResponsiveContainer>
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
        <p className="text-sm text-yellow-700">
          Please upload a dataset to begin analysis.
        </p>
      </div>
    </div>
  </div>
)

export default ANOVAPage
