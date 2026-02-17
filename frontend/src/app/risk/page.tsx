"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
interface RiskMetrics {
  portfolioVolatility: number;
  betaCoefficient: number;
  valueAtRisk: number;
  varConfidence: number;
  concentrationRisk: number;
  sharpeRatio: number;
  maxDrawdown: number;
  sortinoRatio: number;
}

interface ConcentrationItem {
  symbol: string;
  weight: number;
  value: number;
}

interface DrawdownPeriod {
  startDate: string;
  endDate: string;
  drawdown: number;
  duration: number;
}

export default function RiskPage() {
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [concentration, setConcentration] = useState<ConcentrationItem[]>([]);
  const [drawdowns, setDrawdowns] = useState<DrawdownPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Fetch risk metrics
  const fetchRiskMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      // Mock implementation - replace with actual API call
      // const response = await axios.get(`${API_BASE}/portfolio/risk`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // setMetrics(response.data.metrics);

      // Mock data
      setMetrics({
        portfolioVolatility: 18.5,
        betaCoefficient: 1.12,
        valueAtRisk: 5250.00,
        varConfidence: 95,
        concentrationRisk: 32.5,
        sharpeRatio: 1.45,
        maxDrawdown: -15.2,
        sortinoRatio: 1.89
      });

      setConcentration([
        { symbol: 'AAPL', weight: 28.5, value: 35850 },
        { symbol: 'MSFT', weight: 22.3, value: 28038 },
        { symbol: 'GOOGL', weight: 12.8, value: 16096 },
        { symbol: 'JPM', weight: 15.4, value: 19366 },
        { symbol: 'XOM', weight: 9.6, value: 12072 },
        { symbol: 'Others', weight: 11.4, value: 14328 }
      ]);

      setDrawdowns([
        { startDate: '2025-10-15', endDate: '2025-11-05', drawdown: -12.5, duration: 21 },
        { startDate: '2025-08-20', endDate: '2025-09-10', drawdown: -8.3, duration: 21 },
        { startDate: '2025-05-01', endDate: '2025-05-15', drawdown: -5.7, duration: 14 }
      ]);
    } catch (error) {
      console.error('Failed to fetch risk metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskMetrics();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getRiskLevel = (value: number, thresholds: [number, string, string][]) => {
    for (const [threshold, level, color] of thresholds) {
      if (value <= threshold) return { level, color };
    }
    return { level: thresholds[thresholds.length - 1][1], color: thresholds[thresholds.length - 1][2] };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Risk Analysis</h1>
          <p className="text-gray-600">Portfolio risk metrics and analysis</p>
        </div>

        {/* Key Risk Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Portfolio Volatility</div>
            <div className="text-2xl font-bold text-gray-900">{metrics?.portfolioVolatility}%</div>
            <div className="text-xs text-gray-500 mt-1">Annualized standard deviation</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Beta Coefficient</div>
            <div className="text-2xl font-bold text-gray-900">{metrics?.betaCoefficient}</div>
            <div className={`text-xs mt-1 ${metrics?.betaCoefficient && metrics.betaCoefficient > 1 ? 'text-red-500' : 'text-green-500'}`}>
              {metrics?.betaCoefficient && metrics.betaCoefficient > 1 ? 'More volatile than market' : 'Less volatile than market'}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Value at Risk ({metrics?.varConfidence}%)</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics?.valueAtRisk || 0)}</div>
            <div className="text-xs text-gray-500 mt-1">Maximum 1-day potential loss</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Max Drawdown</div>
            <div className="text-2xl font-bold text-red-600">{metrics?.maxDrawdown}%</div>
            <div className="text-xs text-gray-500 mt-1">Largest peak-to-trough decline</div>
          </div>
        </div>

        {/* Risk Ratios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-600">Sharpe Ratio</div>
                <div className="text-3xl font-bold text-gray-900">{metrics?.sharpeRatio}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                metrics?.sharpeRatio && metrics.sharpeRatio >= 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {metrics?.sharpeRatio && metrics.sharpeRatio >= 1 ? 'Good' : 'Moderate'}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Risk-adjusted return measure. Higher is better. A ratio &gt;1 is considered good.
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-600">Sortino Ratio</div>
                <div className="text-3xl font-bold text-gray-900">{metrics?.sortinoRatio}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                metrics?.sortinoRatio && metrics.sortinoRatio >= 1.5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {metrics?.sortinoRatio && metrics.sortinoRatio >= 1.5 ? 'Excellent' : 'Good'}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Downside risk-adjusted return. Focuses only on negative volatility.
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-600">Concentration Risk</div>
                <div className="text-3xl font-bold text-gray-900">{metrics?.concentrationRisk}%</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                metrics?.concentrationRisk && metrics.concentrationRisk > 25 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {metrics?.concentrationRisk && metrics.concentrationRisk > 25 ? 'High' : 'Low'}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Top holding weight. High concentration increases risk.
            </div>
          </div>
        </div>

        {/* Concentration Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation</h2>
            <div className="space-y-3">
              {concentration.map((item) => (
                <div key={item.symbol}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">{item.symbol}</span>
                    <span className="text-gray-600">{item.weight}% ({formatCurrency(item.value)})</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.weight > 25 ? 'bg-red-500' : item.weight > 15 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(item.weight * 2, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            {metrics?.concentrationRisk && metrics.concentrationRisk > 25 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-yellow-800">
                    High concentration risk. Consider diversifying your portfolio.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Historical Drawdowns */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historical Drawdowns</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Period</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Drawdown</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {drawdowns.map((dd, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-sm text-gray-900">
                        {new Date(dd.startDate).toLocaleDateString()} - {new Date(dd.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-sm text-right font-medium text-red-600">
                        {dd.drawdown}%
                      </td>
                      <td className="py-3 text-sm text-right text-gray-600">
                        {dd.duration} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Risk Recommendations */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start p-4 bg-blue-50 rounded-lg">
              <svg className="h-6 w-6 text-blue-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900">Diversification</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Consider reducing exposure to your top holdings. AAPL represents over 28% of your portfolio.
                </p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-green-50 rounded-lg">
              <svg className="h-6 w-6 text-green-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-green-900">Risk-Adjusted Returns</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your Sharpe ratio of {metrics?.sharpeRatio} indicates good risk-adjusted performance.
                </p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-yellow-50 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-medium text-yellow-900">Beta Exposure</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your portfolio beta of {metrics?.betaCoefficient} means you have higher market sensitivity. Consider hedging.
                </p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-purple-50 rounded-lg">
              <svg className="h-6 w-6 text-purple-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <h3 className="font-medium text-purple-900">Value at Risk</h3>
                <p className="text-sm text-purple-700 mt-1">
                  Your 1-day VaR is {formatCurrency(metrics?.valueAtRisk || 0)}. Ensure this aligns with your risk tolerance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
