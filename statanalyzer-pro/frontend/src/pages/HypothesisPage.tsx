import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { runHypothesisTest } from '../api/client'

interface HypothesisPageProps {
  dataId: string | null
  dataInfo: any
}

const HypothesisPage: React.FC<HypothesisPageProps> = ({ dataId, dataInfo }) => {
  const [column, setColumn] = useState('')
  const [mu0, setMu0] = useState('')
  const [alpha, setAlpha] = useState('0.05')

  const mutation = useMutation({
    mutationFn: (data: { data_id: string; column: string; mu0: number; alpha: number }) =>
      runHypothesisTest(data),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dataId || !column || !mu0) return

    mutation.mutate({
      data_id: dataId,
      column,
      mu0: parseFloat(mu0),
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
    link.download = `hypothesis-test-${Date.now()}.json`
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hypothesis Testing</h1>
        <p className="text-gray-600">
          Test whether your sample mean differs significantly from a hypothesized population mean.
        </p>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Test Configuration</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
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
              <label className="label">Hypothesized Mean (μ₀)</label>
              <input
                type="number"
                step="any"
                value={mu0}
                onChange={(e) => setMu0(e.target.value)}
                className="input"
                placeholder="e.g., 100"
                required
              />
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
                Running Test...
              </>
            ) : (
              'Run Hypothesis Test'
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
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">t-Statistic</p>
                <p className="text-3xl font-bold text-blue-600">
                  {mutation.data.t_statistic.toFixed(4)}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">p-value</p>
                <p className="text-3xl font-bold text-purple-600">
                  {mutation.data.p_value.toFixed(6)}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Sample Mean</p>
                <p className="text-2xl font-bold text-green-600">
                  {mutation.data.sample_mean.toFixed(4)}
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Sample Size</p>
                <p className="text-2xl font-bold text-orange-600">
                  n = {mutation.data.sample_size}
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg border-l-4 ${
              mutation.data.decision === 'reject' 
                ? 'bg-red-50 border-red-500' 
                : 'bg-green-50 border-green-500'
            }`}>
              <div className="flex items-start">
                {mutation.data.decision === 'reject' ? (
                  <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                )}
                <div>
                  <h3 className={`font-semibold ${
                    mutation.data.decision === 'reject' ? 'text-red-800' : 'text-green-800'
                  }`}>
                    Decision: {mutation.data.decision === 'reject' ? 'Reject H₀' : 'Fail to Reject H₀'}
                  </h3>
                  <p className={`text-sm ${
                    mutation.data.decision === 'reject' ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {mutation.data.interpretation}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">
                Confidence Interval ({(mutation.data.confidence_interval.level * 100).toFixed(0)}%)
              </h4>
              <p className="text-gray-700">
                [{mutation.data.confidence_interval.lower.toFixed(4)}, {mutation.data.confidence_interval.upper.toFixed(4)}]
              </p>
              <p className="text-sm text-gray-600 mt-2">
                We are {(mutation.data.confidence_interval.level * 100).toFixed(0)}% confident that the true population mean lies within this interval.
              </p>
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

export default HypothesisPage
