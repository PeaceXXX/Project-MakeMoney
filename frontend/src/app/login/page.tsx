'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      const response = await api.post('/api/v1/auth/login', {
        email: formData.email,
        password: formData.password,
      })

      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token)
        router.push('/')
      }
    } catch (error: any) {
      if (error.response?.data?.detail) {
        setError(error.response.data.detail)
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-center mb-6">Sign In</h1>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700"
                placeholder="Your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="space-y-2 text-center text-sm mt-6">
            <p>
              <a href="/register" className="text-blue-600 hover:text-blue-700">
                Create an account
              </a>
            </p>
            <p>
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
