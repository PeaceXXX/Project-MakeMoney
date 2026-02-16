'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const response = await api.post('/api/v1/auth/password-reset-request', {
        email: email,
      })

      if (response.data.message) {
        setSuccess(response.data.message)
        setEmail('')
      }
    } catch (error: any) {
      setError('Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012-2 9.002 0 014-2H7a2 2 0 01-2-2 9.002 0-014-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 00-2-2v1h8a2 2 0 002 2v6a2 2 0 002 2H6z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Forgot Password?
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-md bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 px-4 py-3 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white transition-all focus:ring-blue-500"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0 2.086-.476-4.064-1.29-5.563l-2.097 2.097a1 1 0 01-.849.896 0 1.603c.037.428.128.846.309 1.23l.011.01.012.01v1.813l-.011.009c-.038.436-.12.85-.31 1.24z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={handleBackToLogin}
              className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 px-4 rounded-lg border border-blue-600 hover:border-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            Didn't receive the email? Check your spam folder or{' '}
            <button onClick={handleSubmit} className="text-blue-600 hover:text-blue-700">
              try again
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
