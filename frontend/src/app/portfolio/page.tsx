'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Portfolio, Holding } from '@/types'

export default function PortfolioPage() {
  const router = useRouter()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
      await fetchHoldings(selectedPortfolio.id, token)
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

  return (
    <main className="min-h-screen p-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Portfolio</h1>
          <button
            onClick={handleSignOut}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
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
              <div className="text-center py-16">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You don't have any portfolios yet.
                </p>
                <button
                  onClick={() => {
                    // TODO: Open modal to create new portfolio
                    alert('Create portfolio feature coming soon!')
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg"
                >
                  Create Portfolio
                </button>
              </div>
            )}

            {/* Portfolio Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  onClick={() => handlePortfolioSelect(portfolio)}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl ${
                    selectedPortfolio?.id === portfolio.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <h2 className="text-xl font-bold mb-2">{portfolio.name}</h2>
                  {portfolio.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {portfolio.description}
                    </p>
                  )}
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      {portfolio.holdings_count || 0}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {' '} holdings
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Portfolio Details */}
            {selectedPortfolio && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <button
                  onClick={() => setSelectedPortfolio(null)}
                  className="mb-4 text-blue-600 hover:text-blue-700"
                >
                  ← Back to portfolios
                </button>

                <h2 className="text-3xl font-bold mb-6">
                  {selectedPortfolio.name}
                </h2>

                {selectedPortfolio.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {selectedPortfolio.description}
                  </p>
                )}

                {/* Holdings Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold">Symbol</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Quantity</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Purchase Price</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Current Value</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((holding) => (
                        <tr key={holding.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 font-medium">{holding.symbol}</td>
                          <td className="py-3 px-4">{holding.quantity}</td>
                          <td className="py-3 px-4">{formatCurrency(holding.purchase_price)}</td>
                          <td className="py-3 px-4">
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
                          <td colSpan="4" className="py-8 text-center text-gray-500 dark:text-gray-400">
                            No holdings in this portfolio
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
                    <p className="text-3xl font-bold">
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
                      ({calculatePnL().changePercent >= 0 ? '+' : ''}{Math.abs(calculatePnL().changePercent).toFixed(2)}%)
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Holdings</p>
                    <p className="text-3xl font-bold">
                      {holdings.length}
                    </p>
                  </div>
                </div>

                {/* Delete Portfolio Button */}
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <button
                    onClick={() => handleDeletePortfolio(selectedPortfolio.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg"
                  >
                    Delete Portfolio
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
