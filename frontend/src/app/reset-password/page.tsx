'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!token) {
      setErrors({ form: 'Invalid or expired reset link' })
    }
  }, [token])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.new_password) {
      newErrors.new_password = 'New password is required'
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters'
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password'
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!token) {
      setErrors({ form: 'Invalid or expired reset link' })
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await api.post('/api/v1/auth/password-reset', {
        token: token,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      })

      if (response.data.message) {
        setErrors({ form: response.data.message })
        setTimeout(() => {
          router.push('/login?verified=true')
        }, 3000)
      }
    } catch (error: any) {
      if (error.response?.data?.detail) {
        setErrors({ form: error.response.data.detail })
      } else {
        setErrors({ form: 'Failed to reset password. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoToLogin = () => {
    router.push('/login')
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 3.729-1.087 4.467-2.065 4.675-1.936 5.833-1.936 1.087-2.065 4.517-3.729 1.667-2.502-4.517 1.087-2.065-2.065-3.729-1.667-2.502-4.467-1.936-5.833-1.936-1.087-4.517-3.729-1.087-2.065L12 13m-2.536 0-4.464 1.008-6.536 6.536-1.008 4.464 1.008-6.536 4.464-1.008 9.536 6.536 1.008 4.464 1.008 6.536 6.536-1.008 4.464 1.008 9.536 1.008 6.536-4.464 1.008-6.536-4.464 1.008L12 13" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Invalid Reset Link
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The password reset link is invalid or has expired. Please request a new password reset.
            </p>
            <button
              onClick={handleGoToLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 11-4 0 2 2 0 016 4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c-2.523 0-4.732 2.943-4.732 6.514 0 3.732 2.943 6.514 2.943 12s2.943 4.732 6.514 6.514c0 3.571 2.523 6.514 6.514z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reset Your Password
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Enter your new password below
            </p>
          </div>

          {errors.form && (
            <div className={`mb-6 px-4 py-3 rounded-md ${
              errors.form.includes('successfully')
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}>
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new_password"
                  name="new_password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.new_password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white transition-all pr-10 ${
                    errors.new_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter new password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c-2.523 0-4.732 2.943-4.732 6.514 0 3.732 2.943 6.514 2.943 12s2.943 4.732 6.514 6.514z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c-2.523 0-4.732 2.943-4.732 6.514 0 3.732 2.943 6.514 6.514s2.943 4.732 6.514 6.514z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.new_password && (
                <p className="text-red-500 text-sm mt-1">{errors.new_password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white transition-all ${
                  errors.confirm_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Confirm new password"
                required
                autoComplete="new-password"
              />
              {errors.confirm_password && (
                <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>
              )}
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
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={handleGoToLogin}
              className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 px-4 rounded-lg border border-blue-600 hover:border-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            Password must be at least 8 characters long.
          </p>
        </div>
      </div>
    </div>
  )
}
