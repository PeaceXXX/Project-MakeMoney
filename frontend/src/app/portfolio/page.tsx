'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Portfolio, Holding } from '@/types'

interface CreatePortfolioForm {
  name: string;
  description: string;
}

export default function PortfolioPage() {
  const router = useRouter()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreatePortfolioForm>({ name: '', description: '' })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchPortfolios(token)
  }, [])

  const fetchPortfolios = async (token: string) => {
    setIsLoading(true)
    try {
      const response = await api.get('/api/v1/portfolio')
      setPortfolios(response.data)
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login')
      } else {
        setError('Failed to load portfolios')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHoldings = async (portfolioId: number, token: string) => {
    try {
      const response = await api.get(`/api/v1/portfolio/${portfolioId}/holdings`)
      setHoldings(response.data)
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login')
      } else {
        setError('Failed to load holdings')
      }
    }
  }

  const handlePortfolioSelect = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio)
    fetchHoldings(portfolio.id, localStorage.getItem('access_token')!)
    setError('')
  }

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!createForm.name.trim()) {
      setError('Portfolio name is required')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      const response = await api.post('/api/v1/portfolio', createForm)
      const newPortfolio = response.data
      setPortfolios([...portfolios, newPortfolio])
      setShowCreateModal(false)
      setCreateForm({ name: '', description: '' })
      // Auto-select the newly created portfolio
      handlePortfolioSelect(newPortfolio)
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login')
      } else {
        setError(err.response?.data?.detail || 'Failed to create portfolio')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const calculateTotalValue = () => {
    if (!selectedPortfolio || !holdings.length) return 0
    return holdings.reduce((sum, holding) => {
      // Use purchase price for now - would need real-time market data
      return sum + (holding.quantity * holding.purchase_price)
    }, 0)
  }

  const calculatePnL = () => {
    if (!selectedPortfolio || !holdings.length) return { total: 0, change: 0, changePercent: 0 }
    const currentValue = calculateTotalValue()
    const totalCost = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.purchase_price), 0)
    const change = currentValue - totalCost
    const changePercent = totalCost > 0 ? ((change / totalCost) * 100) : 0

    return {
      total: currentValue,
      change: change,
      changePercent: changePercent
    }
  }

  const handleDeleteHolding = async (holdingId: number) => {
    if (!selectedPortfolio || !confirm('Are you sure you want to delete this holding?')) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      await api.delete(`/api/v1/portfolio/holdings/${holdingId}`)
      await fetchHoldings(selectedPortfolio.id, token!)
    } catch (err: any) {
      setError('Failed to delete holding')
    }
  }

  const handleDeletePortfolio = async (portfolioId: number) => {
    if (!confirm('Are you sure you want to delete this portfolio? This will also delete all holdings.')) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      await api.delete(`/api/v1/portfolio/${portfolioId}`)
      setPortfolios(portfolios.filter(p => p.id !== portfolioId))
      setSelectedPortfolio(null)
      setHoldings([])
    } catch (err: any) {
      setError('Failed to delete portfolio')
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('remember_me')
    router.push('/login')
  }

  const exportPortfolioToCSV = () => {
    if (!selectedPortfolio || holdings.length === 0) {
      alert('No portfolio data to export')
      return
    }

    const headers = ['Symbol', 'Quantity', 'Purchase Price', 'Current Value', 'Gain/Loss']
    const rows = holdings.map(holding => {
      const currentValue = holding.quantity * holding.purchase_price
      const gainLoss = currentValue - (holding.quantity * holding.purchase_price)
      return [
        holding.symbol,
        holding.quantity,
        holding.purchase_price.toFixed(2),
        currentValue.toFixed(2),
        gainLoss.toFixed(2)
      ]
    })

    // Add summary row
    rows.push([])
    rows.push(['Total Value', '', '', calculateTotalValue().toFixed(2), ''])
    rows.push(['Total P&L', '', '', calculatePnL().change.toFixed(2), `${calculatePnL().changePercent.toFixed(2)}%`])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${selectedPortfolio.name}_portfolio_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 md:p-24 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Portfolio</span>
            </button>
            <button
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Portfolio Selector Dropdown */}
        {portfolios.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Portfolio
            </label>
            <select
              value={selectedPortfolio?.id || ''}
              onChange={(e) => {
                const portfolio = portfolios.find(p => p.id === Number(e.target.value))
                if (portfolio) handlePortfolioSelect(portfolio)
              }}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- Select a portfolio --</option>
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name} ({portfolio.holdings_count || 0} holdings)
                </option>
              ))}
            </select>
          </div>
        )}

        {isLoading && portfolios.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Portfolio List */}
            {!selectedPortfolio && portfolios.length === 0 && !isLoading && (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No portfolios yet</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first portfolio to start tracking your investments
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Create Your First Portfolio
                </button>
              </div>
            )}

            {/* Portfolio Cards Grid */}
            {!selectedPortfolio && portfolios.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {portfolios.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    onClick={() => handlePortfolioSelect(portfolio)}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-105 border-2 border-transparent hover:border-blue-500"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{portfolio.name}</h2>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                        Active
                      </span>
                    </div>
                    {portfolio.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {portfolio.description}
                      </p>
                    )}
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {portfolio.holdings_count || 0}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          holdings
                        </span>
                      </div>
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}

                {/* Add New Portfolio Card */}
                <div
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gray-100 dark:bg-gray-700/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 flex flex-col items-center justify-center min-h-[200px]"
                >
                  <svg className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Add New Portfolio</span>
                </div>
              </div>
            )}

            {/* Selected Portfolio Details */}
            {selectedPortfolio && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                <button
                  onClick={() => setSelectedPortfolio(null)}
                  className="mb-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to portfolios</span>
                </button>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {selectedPortfolio.name}
                    </h2>
                    {selectedPortfolio.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {selectedPortfolio.description}
                      </p>
                    )}
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={exportPortfolioToCSV}
                    disabled={holdings.length === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* Holdings Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Symbol</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Purchase Price</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Current Value</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((holding) => (
                        <tr key={holding.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{holding.symbol}</td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{holding.quantity}</td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{formatCurrency(holding.purchase_price)}</td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                            {formatCurrency(holding.quantity * holding.purchase_price)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteHolding(holding.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {holdings.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                            No holdings in this portfolio. Add your first holding to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Value</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(calculateTotalValue())}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Profit/Loss</p>
                    <p className={`text-3xl font-bold ${
                      calculatePnL().changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {calculatePnL().change >= 0 ? '+' : ''}
                      {formatCurrency(calculatePnL().change)}
                      <span className="text-lg ml-1">
                        ({calculatePnL().changePercent >= 0 ? '+' : ''}{Math.abs(calculatePnL().changePercent).toFixed(2)}%)
                      </span>
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Holdings</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {holdings.length}
                    </p>
                  </div>
                </div>

                {/* Rebalancing Suggestions */}
                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rebalancing Suggestions</h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    Based on your target allocation, here are recommended adjustments to balance your portfolio:
                  </p>
                  <div className="space-y-3">
                    {holdings.slice(0, 3).map((holding, index) => {
                      const currentWeight = (holding.quantity * holding.purchase_price) / calculateTotalValue() * 100;
                      const targetWeight = 20 - (index * 5);
                      const diff = currentWeight - targetWeight;
                      return (
                        <div key={holding.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-900 dark:text-white">{holding.symbol}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Current: {currentWeight.toFixed(1)}% | Target: {targetWeight}%
                            </span>
                          </div>
                          <div className={`text-sm font-medium ${diff > 5 ? 'text-red-600 dark:text-red-400' : diff < -5 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                            {diff > 5 ? `Sell ${((diff - 5) * calculateTotalValue() / 100 / holding.purchase_price).toFixed(0)} shares` :
                             diff < -5 ? `Buy ${((-diff - 5) * calculateTotalValue() / 100 / holding.purchase_price).toFixed(0)} shares` :
                             'On target'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button className="mt-4 w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors">
                    Apply Rebalancing
                  </button>
                </div>

                {/* Delete Portfolio Button */}
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <button
                    onClick={() => handleDeletePortfolio(selectedPortfolio.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Delete Portfolio
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Portfolio Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Portfolio</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateForm({ name: '', description: '' })
                  setError('')
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreatePortfolio} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Portfolio Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                  placeholder="e.g., Retirement Fund, Tech Stocks"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                  placeholder="Add a description for this portfolio..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateForm({ name: '', description: '' })
                    setError('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !createForm.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Portfolio</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
