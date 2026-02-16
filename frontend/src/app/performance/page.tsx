"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
interface PerformanceMetrics {
  total_value: number;
  total_cost: number;
  total_return: number;
  total_return_percent: number;
  daily_change: number;
  daily_change_percent: number;
  sharpe_ratio: number | null;
  max_drawdown: number | null;
  annualized_return: number | null;
}

export default function PerformancePage() {
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('1M');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Fetch performance data
  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Mock implementation - replace with actual API call
      // const response = await axios.get(
      //   `${API_BASE}/portfolios/1/performance?timeframe=${timeframe}`,
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      // setPerformance(response.data);

      // Mock data for demonstration
      setPerformance({
        total_value: 125000.00,
        total_cost: 100000.00,
        total_return: 25000.00,
        total_return_percent: 25.0,
        daily_change: 1250.00,
        daily_change_percent: 1.0,
        sharpe_ratio: 1.5,
        max_drawdown: -8.5,
        annualized_return: 15.2
      });
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [timeframe]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getValueColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance</h1>
          <p className="text-gray-600">Track your portfolio performance and metrics</p>
        </div>

        {/* Timeframe Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex space-x-2">
            {['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : performance ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-1">Total Value</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(performance.total_value)}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-1">Total Return</div>
                <div className={`text-2xl font-bold ${getValueColor(performance.total_return)}`}>
                  {formatCurrency(performance.total_return)}
                </div>
                <div className={`text-sm ${getValueColor(performance.total_return_percent)}`}>
                  {formatPercent(performance.total_return_percent)}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-1">Daily Change</div>
                <div className={`text-2xl font-bold ${getValueColor(performance.daily_change)}`}>
                  {formatCurrency(performance.daily_change)}
                </div>
                <div className={`text-sm ${getValueColor(performance.daily_change_percent)}`}>
                  {formatPercent(performance.daily_change_percent)}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-1">Cost Basis</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(performance.total_cost)}
                </div>
              </div>
            </div>

            {/* Advanced Metrics */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Sharpe Ratio</div>
                  <div className="text-xl font-bold text-gray-900">
                    {performance.sharpe_ratio !== null ? performance.sharpe_ratio.toFixed(2) : '-'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Risk-adjusted return measure
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Max Drawdown</div>
                  <div className={`text-xl font-bold ${getValueColor(performance.max_drawdown || 0)}`}>
                    {performance.max_drawdown !== null ? formatPercent(performance.max_drawdown) : '-'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Largest peak-to-trough decline
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Annualized Return</div>
                  <div className={`text-xl font-bold ${getValueColor(performance.annualized_return || 0)}`}>
                    {performance.annualized_return !== null ? formatPercent(performance.annualized_return) : '-'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Yearly average return
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h2>
              <div className="bg-gray-50 rounded-lg p-12 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3-3M12 19V5m0 0l-3-3-3 3m0 0l3 3 3-3m5-5v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1h5" />
                </svg>
                <p>Performance chart coming soon</p>
                <p className="text-sm mt-1">Timeframe: {timeframe}</p>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h2>
              <div className="space-y-3">
                {performance.total_return_percent > 0 ? (
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 0l-2 2a1 1 0 000 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">
                        <strong>Great performance!</strong> Your portfolio has gained <strong>{formatPercent(performance.total_return_percent)}</strong> overall.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">
                        <strong>Review your holdings.</strong> Consider rebalancing to improve performance.
                      </p>
                    </div>
                  </div>
                )}

                {performance.sharpe_ratio && performance.sharpe_ratio > 1 ? (
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 10-2 0v6H6V10.333z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">
                        <strong>Excellent risk-adjusted return.</strong> Your Sharpe ratio of <strong>{performance.sharpe_ratio.toFixed(2)}</strong> indicates good risk management.
                      </p>
                    </div>
                  </div>
                ) : null}

                {performance.max_drawdown && Math.abs(performance.max_drawdown) < 10 ? (
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 0l-2 2a1 1 0 000 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">
                        <strong>Low volatility.</strong> Your maximum drawdown of <strong>{formatPercent(performance.max_drawdown)}</strong> indicates stable performance.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
