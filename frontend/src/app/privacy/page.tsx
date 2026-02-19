'use client'

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Privacy Policy
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Last updated: February 2026
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              1. Information We Collect
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We collect information you provide directly to us, such as when you create an account, make transactions, or contact us for support. This may include your name, email address, and financial information.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              2. How We Use Your Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to protect our platform and users.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              3. Information Sharing
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We do not sell your personal information. We may share your information with third-party service providers who assist us in operating our platform.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              4. Data Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              5. Cookies
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We use cookies and similar technologies to improve your experience on our platform. You can control cookie settings through your browser.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              6. Your Rights
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
              7. Contact Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions about this Privacy Policy, please contact us through our support channels.
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
