import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, CheckCircle, AlertCircle, FileText, BarChart3, TestTube, TrendingUp } from 'lucide-react'
import { uploadData } from '../api/client'

interface UploadPageProps {
  setDataId: (id: string) => void
  setDataInfo: (info: any) => void
}

const UploadPage: React.FC<UploadPageProps> = ({ setDataId, setDataInfo }) => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const navigate = useNavigate()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setError(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const data = await uploadData(file)
      setDataId(data.data_id)
      setDataInfo(data)
      navigate('/statistics')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Professional Statistical Analysis Platform
        </h1>
        <p className="text-gray-600">
          Upload your data to begin comprehensive statistical analysis for business intelligence and healthcare research.
        </p>
      </div>

      <div className="card mb-8">
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Upload Your Dataset
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your file here, or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supported formats: CSV, Excel (.xlsx, .xls)
          </p>

          {file && (
            <div className="mt-6 inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <FileText className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-700">{file.name}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {file && !error && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Upload and Analyze</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard
          icon={<BarChart3 className="w-8 h-8 text-primary-600" />}
          title="Descriptive Analytics"
          description="Comprehensive statistical summaries including mean, median, variance, skewness, and kurtosis analysis."
        />
        <FeatureCard
          icon={<TestTube className="w-8 h-8 text-primary-600" />}
          title="Hypothesis Testing"
          description="Conduct t-tests, ANOVA, and chi-square tests with confidence interval calculations."
        />
        <FeatureCard
          icon={<TrendingUp className="w-8 h-8 text-primary-600" />}
          title="Regression Modeling"
          description="Linear and multiple regression analysis with R-squared, F-statistics, and residual diagnostics."
        />
      </div>
    </div>
  )
}

const FeatureCard: React.FC<{
  icon: React.ReactNode
  title: string
  description: string
}> = ({ icon, title, description }) => (
  <div className="card hover:shadow-md transition-shadow">
    <div className="mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
)

export default UploadPage
