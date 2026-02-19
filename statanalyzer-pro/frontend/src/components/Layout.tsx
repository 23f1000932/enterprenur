import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, Upload, TestTube, TrendingUp, 
  GitCompare, Network, CheckCircle, Droplet
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  dataInfo: any
}

const Layout: React.FC<LayoutProps> = ({ children, dataInfo }) => {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Upload, label: 'Upload Data', section: 'DATA' },
    { path: '/clean', icon: Droplet, label: 'Data Cleaning', section: 'DATA' },
    { path: '/statistics', icon: BarChart3, label: 'Basic Statistics', section: 'DESCRIPTIVE' },
    { path: '/correlation', icon: Network, label: 'Correlation Analysis', section: 'DESCRIPTIVE' },
    { path: '/hypothesis', icon: TestTube, label: 'Hypothesis Testing', section: 'INFERENTIAL' },
    { path: '/regression', icon: TrendingUp, label: 'Regression Analysis', section: 'INFERENTIAL' },
    { path: '/anova', icon: GitCompare, label: 'ANOVA', section: 'INFERENTIAL' },
    { path: '/normality', icon: CheckCircle, label: 'Normality Tests', section: 'QUALITY' },
  ]

  const groupedNav = navItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, typeof navItems>)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold font-display">StatAnalyzer Pro</h1>
                <p className="text-sm text-primary-100">Enterprise Statistical Analysis Platform</p>
              </div>
            </div>
            {dataInfo && (
              <div className="text-right">
                <p className="text-sm font-medium">{dataInfo.filename}</p>
                <p className="text-xs text-primary-100">
                  {dataInfo.rows?.toLocaleString?.()} rows × {dataInfo.columns} columns
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 shadow-sm">
          <nav className="py-6 px-4 space-y-6">
            {Object.entries(groupedNav).map(([section, items]) => (
              <div key={section}>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-3">
                  {section} ANALYSIS
                </h3>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                              : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                          }`}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="absolute bottom-0 w-72 border-t border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              © 2025 StatAnalyzer Pro
            </p>
            <p className="text-xs text-gray-400 text-center">
              Version 2.0 Enterprise
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
