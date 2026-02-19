import axios from 'axios'

const API_BASE_URL = typeof window !== 'undefined' && window.location.origin.includes('hf.space') 
  ? window.location.origin 
  : 'http://localhost:7860'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const uploadData = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return response.data
}

export const getStatistics = async (dataId: string) => {
  const response = await api.get(`/api/statistics/${dataId}`)
  return response.data
}

export const runHypothesisTest = async (data: {
  data_id: string
  column: string
  mu0: number
  alpha: number
}) => {
  const response = await api.post('/api/hypothesis-test', data)
  return response.data
}

export const runRegression = async (data: {
  data_id: string
  y_column: string
  x_column: string
}) => {
  const response = await api.post('/api/regression', data)
  return response.data
}

export const runANOVA = async (data: {
  data_id: string
  value_column: string
  group_column: string
}) => {
  const response = await api.post('/api/anova', data)
  return response.data
}

export const getCorrelation = async (dataId: string) => {
  const response = await api.get(`/api/correlation/${dataId}`)
  return response.data
}

export const runNormalityTest = async (data: {
  data_id: string
  column: string
  alpha: number
}) => {
  const response = await api.post('/api/normality-test', data)
  return response.data
}
