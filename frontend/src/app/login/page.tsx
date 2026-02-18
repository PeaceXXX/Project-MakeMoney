'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [twoFACode, setTwoFACode] = useState('')
  const [pendingToken, setPendingToken] = useState('')

  // Check for redirect parameter after email verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('verified') === 'true') {
      setErrors({ form: 'Email verified successfully! You can now login.' })
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await api.post('/api/v1/auth/login', {
        email: formData.email,
        password: formData.password,
      })

      if (response.data.access_token) {
        // Check if 2FA is required
        if (response.data.requires_2fa) {
          setPendingToken(response.data.temp_token || '')
          setShow2FA(true)
          setIsLoading(false)
          return
        }

        // Store token
        localStorage.setItem('access_token', response.data.access_token)

        // Store remember me preference
        if (formData.rememberMe) {
          localStorage.setItem('remember_me', 'true')
        } else {
          localStorage.removeItem('remember_me')
        }

        // Redirect to home
        router.push('/')
      }
    } catch (error: any) {
      if (error.response?.data?.detail) {
        setErrors({ form: error.response.data.detail })
      } else {
        setErrors({ form: 'Login failed. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (twoFACode.length !== 6) {
      setErrors({ twoFA: 'Please enter a 6-digit code' })
      return
    }

    setIsLoading(true)

    try {
      const response = await api.post('/api/v1/auth/2fa/verify-login', {
        temp_token: pendingToken,
        code: twoFACode,
      })

      if (response.data.access_token) {
        // Store token
        localStorage.setItem('access_token', response.data.access_token)

        // Store remember me preference
        if (formData.rememberMe) {
          localStorage.setItem('remember_me', 'true')
        } else {
          localStorage.removeItem('remember_me')
        }

        // Redirect to home
        router.push('/')
      }
    } catch (error: any) {
      if (error.response?.data?.detail) {
        setErrors({ twoFA: error.response.data.detail })
      } else {
        setErrors({ twoFA: 'Invalid verification code. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {show2FA ? 'Two-Factor Authentication' : 'Welcome Back'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {show2FA ? 'Enter your verification code' : 'Sign in to your account'}
            </p>
          </div>

          {errors.form && (
            <div className={`mb-6 px-4 py-3 rounded-md ${
              errors.form.includes('verified')
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}>
              {errors.form}
            </div>
          )}

          {show2FA ? (
            // 2FA Verification Form
            <form onSubmit={handle2FASubmit} className="space-y-6">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-4">
                <div className="flex items-center justify-center mb-3">
                  <svg className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300 text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div>
                <label htmlFor="twoFACode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  id="twoFACode"
                  name="twoFACode"
                  type="text"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest font-mono transition-all ${
                    errors.twoFA ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                {errors.twoFA && (
                  <p className="text-red-500 text-sm mt-1 text-center">{errors.twoFA}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || twoFACode.length !== 6}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-2.21.804-4.23 2.135-5.77l-.01-.01-.012-.01A7.94 7.94 0 0112 4v8h4v4h4v-4h4v8h-4v4H8v-4H4v-3.709z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShow2FA(false)
                  setTwoFACode('')
                  setPendingToken('')
                  setErrors({})
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Back to Login
              </button>
            </form>
          ) : (
            // Regular Login Form
            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white transition-all ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white transition-all pr-10 ${
                    errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c-2.523 0-4.732 2.943-4.732 6.514 0 3.732 2.943 6.514 2.943 12s2.943 4.732 6.514 6.514c0 3.571 2.523 6.514 6.514z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c-2.523 0-4.732 2.943-4.732 6.514 0 3.732 2.943 6.514 6.514s2.943 4.732 6.514 6.514z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          )}

          {!show2FA && (
          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c.26 1.37-1.04 2.53-2.21 2.53H12V17h4.07c-.72 1.8-2.32 3.14-3.5 3.14h-2.5c-1.8 0-3.28-1.14-3.63-.6 0-.98-.3-1.2-.65-1.6h-.01V12c0 .63.3 1.23.7 1.76h-5.36c-.72.06-1.46.12-2.26.19V12c0-.63-.3-1.23-.7-1.76H4c-.63 0-1.23-.3-1.76-.7V5.26h2.4c.72 1.4 1.64 2.21 3.19 2.21H12V4.01c.75-3.42 2.74-6.12 5.76-7.9l2.56-2.25c.75-.66 1.34-1.54 1.8-2.55l-.34-.54-1.04-.54-1.75 0-.92.35-1.73.97-2.41L12 17h8.16c.72 0 1.45-.27 2.18-.7l1.5-1.5c.68-.68 1.02-1.49 1.02-2.31 0-.89-.34-1.76-.97-2.4l-.6-.6c-.36-.35-.6-.82-.6-1.28V5.26h2.5c.63 0 1.22.3 1.76.7.2.97 0 .6-.27 1.1-.7 1.55l2.2 2.18c.73.73 1.1 1.59 1.1 2.28 0 .72-.3 1.4-.82 1.99-.63.64-1.29.97-1.96.97-.71 0-1.42-.34-2.08-.97l-2.57-2.25c-.73-.64-1.07-1.05-1.77-1.05-.68 0-1.34.26-1.95.73l-2.19 2.19c-.7.7-1.04 1.05-1.75 1.05-.92 0-1.79-.33-2.53-.92l-.6-.6c-.36-.35-.6-.82-.6-1.28v-2.51c0-.46.15-.91.43-1.31l-2.2-2.19c-.7-.7-1.05-1.05-1.77-1.05-.92 0-1.79-.33-2.53-.92l-2.57-2.25c-.73-.64-1.07-1.05-1.77-1.05-.68 0-1.34.26-1.95.73l-2.19 2.19c-.7.7-1.04 1.05-1.75 1.05-.92 0-1.79-.33-2.53-.92l-2.57-2.25c-.73-.64-1.07-1.05-1.77-1.05-.68 0-1.34.26-1.95.73l-2.19 2.19c-.7.7-1.04 1.05-1.75 1.05-.92 0-1.79-.33-2.53-.92l-2.57-2.25c-.73-.64-1.07-1.05-1.77-1.05-.68 0-1.34.26-1.95.73z"/>
                </svg>
                Google
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up
                </a>
              </p>
            </div>

            <div className="text-center">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot your password?
              </a>
            </div>
          </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          By signing in, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
