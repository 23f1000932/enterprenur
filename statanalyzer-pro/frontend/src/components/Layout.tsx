import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, Upload, TestTube, TrendingUp, 
  GitCompare, Network, CheckCircle, Droplet,
  PieChart, Briefcase, Settings, HelpCircle
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  dataInfo: any
}

const Layout: React.FC<LayoutProps> = ({ children, dataInfo }) => {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Upload, label: 'Import Assets', section: 'BUSINESS' },
    { path: '/clean', icon: Droplet, label: 'Data Refinery', section: 'BUSINESS' },
    { path: '/statistics', icon: LayoutDashboard, label: 'Business Insights', section: 'ANALYSIS' },
    { path: '/correlation', icon: Network, label: 'Market Correlation', section: 'ANALYSIS' },
    { path: '/hypothesis', icon: TestTube, label: 'Strategic Testing', section: 'PREDICTIVE' },
    { path: '/regression', icon: TrendingUp, label: 'Growth Forecast', section: 'PREDICTIVE' },
    { path: '/anova', icon: GitCompare, label: 'Asset Comparison', section: 'STRATEGY' },
    { path: '/normality', icon: CheckCircle, label: 'Quality Audit', section: 'STRATEGY' },
  ]

  const groupedNav = navItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, typeof navItems>)

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      {/* Side Navigation */}
      <aside className="w-72 bg-white border-r border-slate-200 shadow-xl flex flex-col fixed h-full z-20">
        <div className="p-8 border-b border-slate-100 flex items-center space-x-3 bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <PieChart className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">STRATLYTIC</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Enterprise Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8 py-8 scrollbar-hide">
          {Object.entries(groupedNav).map(([section, items]) => (
            <div key={section} className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-4 mb-4">
                {section} ECOSYSTEM
              </h3>
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`group flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm border-l-4 border-indigo-600'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600 border-l-4 border-transparent'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mr-4 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-4 p-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              AH
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black truncate">Ayan Hussain</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Startup Owner</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col pl-72">
        {/* Top Intelligence Bar */}
        <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between px-10 shadow-sm backdrop-blur-md bg-white/90">
          <div className="flex items-center space-x-6">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {location.pathname === '/' ? 'Data Onboarding' : location.pathname.substring(1).split('/').join(' > ')}
            </h2>
            <div className="h-4 w-px bg-slate-200"></div>
            {dataInfo && (
              <div className="flex items-center space-x-4 animate-in fade-in slide-in-from-left duration-500">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Active Repository</span>
                  <span className="text-xs font-black text-indigo-600 truncate max-w-[200px]">{dataInfo.filename}</span>
                </div>
                <div className="bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-indigo-700">
                    {dataInfo.rows?.toLocaleString()} DATA POINTS
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300 flex items-center space-x-2">
              <Briefcase className="w-4 h-4" />
              <span>EXPORT REPORT</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Surface */}
        <main className="flex-1 p-10 bg-slate-50/50 relative overflow-hidden">
          {/* Abstract Background Decoration */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl -z-10"></div>
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-violet-100/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="max-w-6xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
