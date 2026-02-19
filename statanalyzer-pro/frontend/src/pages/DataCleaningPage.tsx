import React, { useState } from 'react'
import { AlertCircle, Loader2, CheckCircle, Download } from 'lucide-react'
import { api } from '../api/client'

interface DataCleaningPageProps {
  dataId: string | null
  dataInfo: any
  setDataId: (id: string) => void
  setDataInfo: (info: any) => void
}

const cleaningStrategies = [
  { value: 'fill_mean', label: 'Mean Imputation' },
  { value: 'fill_median', label: 'Median Imputation' },
  { value: 'fill_mode', label: 'Mode Imputation' },
  { value: 'drop_missing', label: 'Drop Missing Rows' }
]

const outlierStrategies = [
  { value: 'iqr', label: 'IQR Method' },
  { value: 'zscore', label: 'Z-score Method' }
]

const scalingStrategies = [
  { value: 'standard', label: 'StandardScaler (Z-score)' },
  { value: 'minmax', label: 'MinMaxScaler (0-1)' }
]

const DataCleaningPage: React.FC<DataCleaningPageProps> = ({ dataId, dataInfo, setDataId }) => {
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [missingMethod, setMissingMethod] = useState('fill_mean')
  const [outlierMethod, setOutlierMethod] = useState('iqr')
  const [scaler, setScaler] = useState('standard')

  // Load preview & stats
  React.useEffect(() => {
    if (!dataId) {
      setPreview(null)
      return
    }
    setLoading(true)
    setMessage(null)
    setError(null)
    api.get(`/api/data-preview/${dataId}`)
      .then(res => setPreview(res.data))
      .catch(() => setError('Failed to load preview'))
      .finally(() => setLoading(false))
  }, [dataId])

  const handleImpute = async () => {
    setLoading(true); setMessage(null); setError(null)
    try {
      const res = await api.post('/api/clean-missing', { data_id: dataId, operation: missingMethod })
      setMessage(res.data.message)
      setDataId(res.data.new_data_id)
    } catch {
      setError('Impute failed')
    } finally { setLoading(false)}
  }

  const handleOutliers = async () => {
    setLoading(true); setMessage(null); setError(null)
    const numericColumns = preview?.columns || []
    try {
      const res = await api.post('/api/remove-outliers', {
        data_id: dataId,
        method: outlierMethod,
        columns: numericColumns
      })
      setMessage(res.data.message)
      setDataId(res.data.new_data_id)
    } catch {
      setError('Remove outliers failed')
    } finally { setLoading(false) }
  }

  const handleScale = async () => {
    setLoading(true); setMessage(null); setError(null)
    const numericColumns = preview?.columns || []
    try {
      const res = await api.post('/api/scale-data', {
        data_id: dataId,
        method: scaler,
        columns: numericColumns
      })
      setMessage(res.data.message)
      setDataId(res.data.new_data_id)
    } catch {
      setError('Scaling failed')
    } finally { setLoading(false) }
  }

  const handleDownload = () => {
    if (!preview) return
    const rows: string[] = []
    rows.push(preview.columns.join(','))
    preview.preview.forEach((row: any) => {
      rows.push(preview.columns.map((h: string) => row[h]).join(','))
    })
    const csvString = rows.join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cleaned_data.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!dataId) {
    return (
      <div className="card border-l-4 border-yellow-500 bg-yellow-50 my-10">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">No Data Loaded</h3>
            <p className="text-sm text-yellow-700">
              Please upload a dataset first.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-bold text-2xl mb-2 text-gray-800">🧹 Data Cleaning Dashboard</h1>
      <div className="mb-6 text-gray-600">Enterprise-grade pre-processing—safe, tested, upgradeable!</div>

      {/* Status */}
      {loading && (
        <div className="flex gap-2 items-center text-blue-700 mb-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </div>
      )}
      {!loading && message && (
        <div className="flex gap-2 items-center text-green-700 mb-4">
          <CheckCircle className="w-5 h-5" />
          {message}
        </div>
      )}
      {!loading && error && (
        <div className="flex gap-2 items-center text-red-700 mb-4">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats + Download */}
      {preview && (
        <div className="grid md:grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 card">
            <div className="font-bold text-gray-700">Rows</div>
            <div className="font-mono">{preview.shape[0]}</div>
          </div>
          <div className="bg-purple-50 card">
            <div className="font-bold text-gray-700">Columns</div>
            <div className="font-mono">{preview.shape[1]}</div>
          </div>
          <div className="bg-orange-50 card">
            <div className="font-bold text-gray-700">Missing</div>
            <div className="font-mono">
              {(Object.values(preview.missing_values || {}) as number[]).reduce((a, b) => a + b, 0)}
            </div>
          </div>
          <div className="bg-green-50 card flex items-center justify-center">
            <button className="btn-secondary flex items-center gap-2" onClick={handleDownload}>
              <Download className="w-5 h-5" /> Download Cleaned CSV
            </button>
          </div>
        </div>
      )}

      {/* Cleaning Controls */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="card">
          <div className="font-semibold mb-2">Impute Missing Values</div>
          <select
            className="input mb-2"
            value={missingMethod}
            onChange={e => setMissingMethod(e.target.value)}
          >
            {cleaningStrategies.map(s => (
              <option value={s.value} key={s.value}>{s.label}</option>
            ))}
          </select>
          <button className="btn-primary w-full" onClick={handleImpute} disabled={loading}>
            Impute
          </button>
        </div>

        <div className="card">
          <div className="font-semibold mb-2">Remove Outliers</div>
          <select
            className="input mb-2"
            value={outlierMethod}
            onChange={e => setOutlierMethod(e.target.value)}
          >
            {outlierStrategies.map(s => (
              <option value={s.value} key={s.value}>{s.label}</option>
            ))}
          </select>
          <button className="btn-primary w-full" onClick={handleOutliers} disabled={loading}>
            Remove Outliers
          </button>
        </div>

        <div className="card">
          <div className="font-semibold mb-2">Scale Data</div>
          <select
            className="input mb-2"
            value={scaler}
            onChange={e => setScaler(e.target.value)}
          >
            {scalingStrategies.map(s => (
              <option value={s.value} key={s.value}>{s.label}</option>
            ))}
          </select>
          <button className="btn-primary w-full" onClick={handleScale} disabled={loading}>
            Scale Data
          </button>
        </div>
      </div>

      {/* Data Preview Table */}
      {preview && (
        <div className="card">
          <h2 className="font-bold text-lg mb-2">Preview (First 10 Rows)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {preview.columns.map((col: string) => (
                    <th key={col} className="px-2 py-1 text-xs font-bold text-gray-600">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((row: any, idx: number) => (
                  <tr key={idx}>
                    {preview.columns.map((col: string) => (
                      <td key={col} className="px-2 py-1 text-xs">
                        {row[col] !== null && row[col] !== undefined
                          ? (typeof row[col] === 'number' ? row[col].toFixed(2) : row[col])
                          : <span className="text-gray-400">null</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataCleaningPage
