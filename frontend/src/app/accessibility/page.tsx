"use client";

import React from 'react';

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Accessibility Statement</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Our commitment to making trading accessible to everyone
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8 transition-colors duration-200">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Our Commitment</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We are committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA. These guidelines explain how to make web content more accessible for people with disabilities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Accessibility Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Keyboard Navigation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Full site navigation using keyboard only</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Screen Reader Support</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Compatible with popular screen readers</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Color Contrast</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">High contrast colors for readability</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <svg className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Resizable Text</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Text can be resized up to 200%</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Keyboard Shortcuts</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full" role="table" aria-label="Keyboard shortcuts">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Shortcut</th>
                    <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4"><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Tab</kbd></td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Navigate forward through elements</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4"><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Shift + Tab</kbd></td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Navigate backward through elements</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4"><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Enter</kbd></td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Activate buttons and links</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4"><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Escape</kbd></td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Close modals and menus</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4"><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Arrow Keys</kbd></td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Navigate within menus and lists</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Known Issues</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Despite our best efforts, some accessibility issues may exist. We are actively working to address these:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
              <li>Some third-party chart components may not be fully keyboard accessible</li>
              <li>Real-time data updates may not always announce changes to screen readers</li>
              <li>Some complex tables may need additional navigation support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              If you experience any accessibility barriers or have suggestions for improvement, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-900 dark:text-white font-medium">Accessibility Team</p>
              <p className="text-gray-600 dark:text-gray-400">Email: accessibility@trading.com</p>
              <p className="text-gray-600 dark:text-gray-400">Phone: 1-800-TRADING (TTY available)</p>
              <p className="text-gray-600 dark:text-gray-400">Response time: Within 2 business days</p>
            </div>
          </section>
        </div>

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>This statement was last updated on February 17, 2026.</p>
          <p className="mt-1">We review and update our accessibility practices regularly.</p>
        </div>
      </div>
    </div>
  );
}
