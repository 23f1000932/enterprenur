import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, CheckCircle, AlertCircle, FileText, Rocket, Target, Zap } from 'lucide-react'
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
      setError(err.response?.data?.detail || 'System error. Asset onboarding failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
          <Zap className="w-4 h-4 text-indigo-600" />
          <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Next-Gen Data Engine</span>
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">
          Unlock Your Business <span className="text-indigo-600">DNA.</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          Upload your enterprise assets to transform raw data into strategic growth opportunities.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-2 shadow-2xl shadow-indigo-100 border border-slate-100">
        <div
          className={`relative border-4 border-dashed rounded-[2rem] p-16 text-center transition-all duration-500 group ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50'
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
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={uploading}
          />
          
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-400 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <Upload className={`w-20 h-20 mx-auto mb-6 transition-all duration-500 ${dragActive ? 'text-indigo-600 scale-110' : 'text-slate-300 group-hover:text-indigo-400'}`} />
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 mb-3">
            Drop Your Asset Here
          </h3>
          <p className="text-slate-500 mb-8 font-bold text-sm tracking-wide uppercase">
            CSV, EXCEL (XLSX, XLS) SUPPORTED
          </p>

          {file && (
            <div className="mt-8 flex justify-center animate-in zoom-in duration-300">
              <div className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-xl">
                <FileText className="w-5 h-5 text-indigo-400 mr-3" />
                <span className="text-sm font-black truncate max-w-[200px]">{file.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center space-x-4 animate-in slide-in-from-top">
          <div className="bg-red-500 p-2 rounded-xl">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-black text-red-700 uppercase tracking-wider">{error}</p>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`px-10 py-5 rounded-[1.5rem] font-black text-sm tracking-[0.1em] uppercase transition-all duration-500 flex items-center space-x-3 ${
            !file 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 hover:bg-slate-900 hover:-translate-y-1'
          }`}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-4 border-white/20 border-t-white" />
              <span>Analyzing Market...</span>
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              <span>Execute Intelligence</span>
            </>
          )}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8 pt-8">
        <FeatureCard
          icon={<Zap className="w-6 h-6" />}
          title="Instant KPIs"
          description="Real-time performance metrics derived from your operational datasets."
        />
        <FeatureCard
          icon={<Target className="w-6 h-6" />}
          title="Market Fit"
          description="Validate strategic hypotheses with precision statistical auditing."
        />
        <FeatureCard
          icon={<Rocket className="w-6 h-6" />}
          title="Growth Velocity"
          description="Predictive modeling to forecast your enterprise expansion path."
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
  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
      {icon}
    </div>
    <h3 className="text-lg font-black text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 text-sm font-medium leading-relaxed">{description}</p>
  </div>
)

export default UploadPage
