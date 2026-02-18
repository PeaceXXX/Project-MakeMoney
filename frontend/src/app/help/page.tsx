"use client";

import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: "Getting Started",
    question: "How do I create an account?",
    answer: "Click the 'Register' button in the top right corner, enter your email address and create a secure password. You'll receive a verification email to confirm your account."
  },
  {
    category: "Getting Started",
    question: "How do I deposit funds into my account?",
    answer: "Navigate to the Account page, click 'Deposit Funds', and follow the instructions to link your bank account or use another payment method."
  },
  {
    category: "Trading",
    question: "What is the difference between market and limit orders?",
    answer: "A market order executes immediately at the current market price. A limit order only executes when the stock reaches your specified price or better."
  },
  {
    category: "Trading",
    question: "How do I place a stop-loss order?",
    answer: "When placing an order, select 'Stop-Loss' as the order type. Enter your stop price - when the stock reaches this price, your order will be triggered as a market order."
  },
  {
    category: "Portfolio",
    question: "How do I track my portfolio performance?",
    answer: "Navigate to the Portfolio page to see your holdings, total value, and profit/loss. The Performance page provides detailed analytics including returns, risk metrics, and benchmark comparisons."
  },
  {
    category: "Portfolio",
    question: "Can I have multiple portfolios?",
    answer: "Yes! You can create multiple portfolios to organize your investments. Click 'New Portfolio' on the Portfolio page to create a new one."
  },
  {
    category: "Account",
    question: "How do I enable two-factor authentication?",
    answer: "Two-factor authentication is coming soon. This feature will add an extra layer of security to your account."
  },
  {
    category: "Account",
    question: "How do I change my password?",
    answer: "Go to Settings > Change Password. Enter your current password and your new password to update it."
  },
  {
    category: "Technical",
    question: "What browsers are supported?",
    answer: "We support the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience, we recommend keeping your browser updated."
  },
  {
    category: "Technical",
    question: "How do I enable dark mode?",
    answer: "Go to Settings > Appearance and toggle the Dark Mode switch. Your preference will be saved automatically."
  }
];

const GETTING_STARTED_STEPS = [
  {
    step: 1,
    title: "Create Your Account",
    description: "Sign up with your email and verify your account to get started.",
    icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
  },
  {
    step: 2,
    title: "Set Up Your Portfolio",
    description: "Create your first portfolio and add your existing holdings to track performance.",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
  },
  {
    step: 3,
    title: "Explore the Markets",
    description: "Use our screener and market data tools to discover investment opportunities.",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
  },
  {
    step: 4,
    title: "Place Your First Trade",
    description: "Execute your first order using our intuitive trading interface.",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
  },
  {
    step: 5,
    title: "Monitor & Analyze",
    description: "Track your performance, set alerts, and make informed decisions.",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
  }
];

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", ...Array.from(new Set(FAQ_DATA.map(item => item.category)))];

  const filteredFAQs = FAQ_DATA.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Help & Support</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Find answers to common questions and learn how to get the most out of our platform
          </p>
        </div>

        {/* Getting Started Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {GETTING_STARTED_STEPS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-3">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Step {step.step}</div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{item.question}</span>
                  <svg
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      expandedFAQ === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === index && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
            {filteredFAQs.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No questions found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg inline-block mb-4">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Documentation</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Read our comprehensive documentation for detailed guides and API references.
            </p>
            <button className="text-green-600 dark:text-green-400 font-medium text-sm hover:underline">
              View Documentation
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg inline-block mb-4">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Contact Support</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <button className="text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline">
              Contact Support
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg inline-block mb-4">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Community</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Join our community to connect with other traders and share insights.
            </p>
            <button className="text-purple-600 dark:text-purple-400 font-medium text-sm hover:underline">
              Join Community
            </button>
          </div>
        </div>

        {/* Video Tutorials Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Video Tutorials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Platform Overview", duration: "5:30" },
              { title: "Placing Your First Trade", duration: "3:45" },
              { title: "Understanding Charts", duration: "4:15" }
            ].map((video, index) => (
              <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-lg aspect-video flex items-center justify-center relative group cursor-pointer">
                <div className="absolute inset-0 bg-black/10 dark:bg-black/30 group-hover:bg-black/20 transition-colors rounded-lg"></div>
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-gray-800/80 text-blue-600 mb-2">
                    <svg className="h-6 w-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{video.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{video.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
