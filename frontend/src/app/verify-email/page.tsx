'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useState(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link')
    } else {
      verifyEmail(token)
    }
  })

  const verifyEmail = async (verificationToken: string) => {
    try {
      await api.post('/api/v1/auth/verify-email', {
        token: verificationToken,
      })
      setStatus('success')
      setMessage('Email verified successfully! You can now login.')
    } catch (error: any) {
      setStatus('error')
      setMessage(
        error.response?.data?.detail || 'Verification failed. Please try again or request a new verification email.'
      )
    }
  }

  const handleGoToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="mb-6">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Verifying Email...</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we verify your email.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">
                Email Verified!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <button
                onClick={handleGoToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Go to Login
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">
                Verification Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <button
                onClick={handleGoToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
