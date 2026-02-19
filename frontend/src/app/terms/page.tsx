'use client'

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Terms of Service
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Last updated: February 2026
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              By accessing and using this Trading Platform, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              2. Use License
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Permission is granted to temporarily use this platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              3. Disclaimer
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This platform is provided "as is" without any warranties, expressed or implied. We do not warrant that this platform will be uninterrupted or error-free.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              4. Limitations
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              In no event shall Trading Platform be liable for any damages arising out of the use or inability to use the materials on this platform.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              5. Revisions
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The materials appearing on this platform may include technical, typographical, or photographic errors. We do not warrant that any of the materials are accurate, complete, or current.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              6. Investment Disclaimer
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This platform is for informational purposes only. It is not intended as investment advice. Always consult with a qualified financial advisor before making investment decisions.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
