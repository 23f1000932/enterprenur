import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import UploadPage from './pages/UploadPage'
import DataCleaningPage from './pages/DataCleaningPage'
import StatisticsPage from './pages/StatisticsPage'
import HypothesisPage from './pages/HypothesisPage'
import RegressionPage from './pages/RegressionPage'
import ANOVAPage from './pages/ANOVAPage'
import CorrelationPage from './pages/CorrelationPage'
import NormalityPage from './pages/NormalityPage'

function App() {
  const [dataId, setDataId] = useState<string | null>(null)
  const [dataInfo, setDataInfo] = useState<any>(null)

  return (
    <Router>
      <Layout dataInfo={dataInfo}>
        <Routes>
          <Route 
            path="/" 
            element={<UploadPage setDataId={setDataId} setDataInfo={setDataInfo} />} 
          />
          <Route 
            path="/clean" 
            element={<DataCleaningPage dataId={dataId} dataInfo={dataInfo} setDataId={setDataId} setDataInfo={setDataInfo} />}
          />
          <Route 
            path="/statistics" 
            element={<StatisticsPage dataId={dataId} />} 
          />
          <Route 
            path="/hypothesis" 
            element={<HypothesisPage dataId={dataId} dataInfo={dataInfo} />} 
          />
          <Route 
            path="/regression" 
            element={<RegressionPage dataId={dataId} dataInfo={dataInfo} />} 
          />
          <Route 
            path="/anova" 
            element={<ANOVAPage dataId={dataId} dataInfo={dataInfo} />} 
          />
          <Route 
            path="/correlation" 
            element={<CorrelationPage dataId={dataId} />} 
          />
          <Route 
            path="/normality" 
            element={<NormalityPage dataId={dataId} dataInfo={dataInfo} />} 
          />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
