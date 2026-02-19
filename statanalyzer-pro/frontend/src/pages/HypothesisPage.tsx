import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AlertCircle, CheckCircle, TrendingUp, Zap, Target, Shield } from 'lucide-react'
import { runHypothesisTest } from '../api/client'

interface HypothesisPageProps {
  dataId: string | null
  dataInfo: Record<string, any>
}

const HypothesisPage: React.FC<HypothesisPageProps> = ({ dataId, dataInfo }) => {
  const [column, setColumn] = useState<string>('')
  const [mu0, setMu0] = useState<number>(0)
  const [alpha, setAlpha] = useState<number>(0.05)

  const columns = dataInfo?.columns || []

  const mutation = useMutation({
    mutationFn: async () => {
      if (!dataId || !column) return
      return await runHypothesisTest({ dataId, column, mu0: parseFloat(String(mu0)), alpha: parseFloat(String(alpha)) })
    },
  })

  if (!dataId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/50">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Hypothesis Testing</h2>
          <p className="text-gray-400">Upload data to run statistical hypothesis tests</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Statistical Hypothesis Testing
        </h1>
        <p className="text-gray-400 text-lg">Perform t-tests and generate detailed statistical reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Configuration */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Test Configuration
            </h3>

            {/* Column Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-200 mb-2">Select Column</label>
              <select
                value={column}
                onChange={(e) => setColumn(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg text-white focus:border-indigo-500 outline-none transition-all"
              >
                <option value="">Choose a column...</option>
                {columns.map((col: string) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* Hypothesis Mean */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-200 mb-2">Null Hypothesis Mean (μ₀)</label>
              <input
                type="number"
                value={mu0}
                onChange={(e) => setMu0(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg text-white focus:border-indigo-500 outline-none transition-all"
                placeholder="0.0"
              />
            </div>

            {/* Significance Level */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-200 mb-2">Significance Level (α)</label>
              <select
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg text-white focus:border-indigo-500 outline-none transition-all"
              >
                <option value={0.01}>0.01 (99% confidence)</option>
                <option value={0.05}>0.05 (95% confidence)</option>
                <option value={0.1}>0.1 (90% confidence)</option>
              </select>
            </div>

            {/* Run Test Button */}
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !column}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-indigo-500/50 hover:shadow-xl"
            >
              {mutation.isPending ? (
                <span className="animate-spin">⌛</span>
              ) : (
                <Zap className="w-5 h-5" />
              )}
              {mutation.isPending ? 'Running Test...' : 'Run Test'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {mutation.isSuccess && mutation.data && (
            <>
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Test Results Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Test Statistic */}
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Test Statistic (t)</p>
                    <p className="text-2xl font-bold text-white">{(mutation.data as any).t_statistic?.toFixed(4)}</p>
                  </div>

                  {/* P-value */}
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">P-value</p>
                    <p className="text-2xl font-bold text-white">{(mutation.data as any).p_value?.toFixed(6)}</p>
                  </div>

                  {/* Degrees of Freedom */}
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Degrees of Freedom</p>
                    <p className="text-2xl font-bold text-white">{(mutation.data as any).df}</p>
                  </div>

                  {/* Conclusion */}
                  <div className={`rounded-xl p-4 ${
                    (mutation.data as any).reject_null
                      ? 'bg-red-500/10 border border-red-500/30'
                      : 'bg-green-500/10 border border-green-500/30'
                  }`}>
                    <p className="text-sm text-gray-400 mb-1">Conclusion</p>
                    <p className={`text-sm font-bold ${
                      (mutation.data as any).reject_null ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {(mutation.data as any).reject_null ? 'Reject H₀' : 'Fail to Reject H₀'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interpretation */}
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Interpretation</h3>
                <p className="text-gray-300 leading-relaxed">
                  {(mutation.data as any).reject_null
                    ? `With a p-value of ${(mutation.data as any).p_value?.toFixed(6)}, which is less than the significance level of ${alpha}, we have strong evidence to reject the null hypothesis. The mean is significantly different from ${mu0}.`
                    : `With a p-value of ${(mutation.data as any).p_value?.toFixed(6)}, which is greater than the significance level of ${alpha}, we do not have sufficient evidence to reject the null hypothesis.`}
                </p>
              </div>
            </>
          )}

          {mutation.isPending && (
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-cyan-500 mx-auto mb-4"></div>
                <p className="text-white font-semibold">Running hypothesis test...</p>
              </div>
            </div>
          )}

          {mutation.isError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-semibold mb-1">Error</p>
                <p className="text-gray-300">Failed to run hypothesis test. Please try again.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HypothesisPage
