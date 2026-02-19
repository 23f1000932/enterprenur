import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, LineChart, Activity, TrendingUp, PieChart, Target, DollarSign, Users, ShoppingCart, AlertCircle } from 'lucide-react'

interface BusinessMetrics {
  revenue: number
  growth: number
  customers: number
  conversion: number
}

interface ChartData {
  month: string
  revenue: number
  customers: number
}

const BusinessDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    revenue: 0,
    growth: 0,
    customers: 0,
    conversion: 0
  })

  const [chartData] = useState<ChartData[]>([
    { month: 'Jan', revenue: 45000, customers: 120 },
    { month: 'Feb', revenue: 52000, customers: 145 },
    { month: 'Mar', revenue: 61000, customers: 168 },
    { month: 'Apr', revenue: 58000, customers: 152 },
    { month: 'May', revenue: 70000, customers: 189 },
    { month: 'Jun', revenue: 85000, customers: 215 }
  ])

  useEffect(() => {
    // Animate metrics on load
    const timer = setTimeout(() => {
      setMetrics({
        revenue: 425000,
        growth: 23.5,
        customers: 1089,
        conversion: 3.8
      })
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const AnalysisCard = ({ icon: Icon, title, value, change, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
          change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </span>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )

  const QuickInsight = ({ icon: Icon, title, description, trend }: any) => (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 hover:border-blue-300 transition-all">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-600 mb-2">{description}</p>
          <span className="text-xs font-medium text-blue-600">{trend}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Business Intelligence Dashboard
          </h1>
          <p className="text-gray-600">Real-time analytics and insights for data-driven decisions</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 bg-white p-2 rounded-xl shadow-sm">
          {['overview', 'analytics', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalysisCard
            icon={DollarSign}
            title="Total Revenue"
            value={`$${metrics.revenue.toLocaleString()}`}
            change={metrics.growth}
            color="from-green-500 to-emerald-600"
          />
          <AnalysisCard
            icon={TrendingUp}
            title="Growth Rate"
            value={`${metrics.growth}%`}
            change={5.2}
            color="from-blue-500 to-cyan-600"
          />
          <AnalysisCard
            icon={Users}
            title="Total Customers"
            value={metrics.customers.toLocaleString()}
            change={12.8}
            color="from-purple-500 to-pink-600"
          />
          <AnalysisCard
            icon={Target}
            title="Conversion Rate"
            value={`${metrics.conversion}%`}
            change={-1.2}
            color="from-orange-500 to-red-600"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Revenue Trend</h3>
              <BarChart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="space-y-3">
              {chartData.map((data, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-600 w-12">{data.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-end pr-3"
                      style={{ width: `${(data.revenue / 85000) * 100}%` }}
                    >
                      <span className="text-xs font-semibold text-white">
                        ${(data.revenue / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Growth Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Customer Growth</h3>
              <LineChart className="w-6 h-6 text-green-600" />
            </div>
            <div className="space-y-3">
              {chartData.map((data, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-600 w-12">{data.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-end pr-3"
                      style={{ width: `${(data.customers / 215) * 100}%` }}
                    >
                      <span className="text-xs font-semibold text-white">{data.customers}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickInsight
              icon={Activity}
              title="Peak Performance Period"
              description="June shows 21% higher revenue compared to average"
              trend="Strong growth momentum detected"
            />
            <QuickInsight
              icon={AlertCircle}
              title="Conversion Optimization"
              description="Conversion rate dropped 1.2% - recommend A/B testing"
              trend="Action recommended"
            />
            <QuickInsight
              icon={ShoppingCart}
              title="Customer Acquisition"
              description="Customer base growing at 12.8% monthly rate"
              trend="Excellent retention metrics"
            />
            <QuickInsight
              icon={PieChart}
              title="Revenue Diversification"
              description="Top 3 segments account for 67% of total revenue"
              trend="Consider market expansion"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/upload')}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Upload New Data
          </button>
          <button
            onClick={() => navigate('/statistics')}
            className="flex-1 bg-white text-gray-900 py-4 px-8 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-md border border-gray-200"
          >
            View Detailed Analytics
          </button>
        </div>
      </div>
    </div>
  )
}

export default BusinessDashboard
