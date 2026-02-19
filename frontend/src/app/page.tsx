'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      // Redirect logged-in users to dashboard
      router.push('/dashboard')
      return
    }
    setIsAuthenticated(false)
  }, [])

  return (
    <main className="min-h-screen p-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">
            Trading Platform
          </h1>
          {isAuthenticated ? (
            <button
              onClick={() => {
                localStorage.removeItem('access_token')
                window.location.href = '/'
              }}
              className="text-red-600 hover:text-red-700"
            >
              Sign Out
            </button>
          ) : (
            <div className="space-x-4">
              <a href="/login" className="text-blue-600 hover:text-blue-700">
                Sign In
              </a>
              <a href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                Create Account
              </a>
            </div>
          )}
        </div>

        <p className="text-xl mb-8">
          Welcome to the Trading and Finance Platform
        </p>

        {isAuthenticated ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2">Welcome Back!</h2>
            <p className="text-gray-700 dark:text-gray-300">
              You are logged in. Start exploring your portfolio and trading features.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2">Get Started</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Create an account to start managing your portfolio, trading stocks, and tracking performance.
            </p>
            <a href="/register" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md">
              Create Free Account
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-2">Portfolio</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your investment portfolio
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-2">Market Data</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time stock prices and charts
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-2">Trading</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Execute trades and manage orders
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
