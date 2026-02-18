"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';

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

interface RiskSettings {
  stopLossPercent: number;
  alertsEnabled: boolean;
  alertThreshold: number;
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
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [concentration, setConcentration] = useState<ConcentrationItem[]>([]);
  const [drawdowns, setDrawdowns] = useState<DrawdownPeriod[]>([]);
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({
    stopLossPercent: 10,
    alertsEnabled: true,
    alertThreshold: 5
  });
  const [loading, setLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

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
    loadRiskSettings();
  }, []);

  const loadRiskSettings = () => {
    const savedSettings = localStorage.getItem('riskSettings');
    if (savedSettings) {
      try {
        setRiskSettings(JSON.parse(savedSettings));
      } catch (e) {
        // Use defaults
      }
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('riskSettings', JSON.stringify(riskSettings));
    setSettingsSaved(true);
    setTimeout(() => {
      setShowSettingsModal(false);
      setSettingsSaved(false);
    }, 1500);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Risk Analysis</h1>
            <p className="text-gray-600 dark:text-gray-400">Portfolio risk metrics and analysis</p>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Risk Settings</span>
          </button>
        </div>

        {/* Stop-Loss Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Stop-Loss Level</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your portfolio will be alerted if it drops more than <span className="font-bold text-red-600 dark:text-red-400">{riskSettings.stopLossPercent}%</span> from its high
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{riskSettings.stopLossPercent}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Stop-Loss Threshold</div>
            </div>
          </div>
        </div>

        {/* Key Risk Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Portfolio Volatility</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics?.portfolioVolatility}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Annualized standard deviation</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Beta Coefficient</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics?.betaCoefficient}</div>
            <div className={`text-xs mt-1 ${metrics?.betaCoefficient && metrics.betaCoefficient > 1 ? 'text-red-500' : 'text-green-500'}`}>
              {metrics?.betaCoefficient && metrics.betaCoefficient > 1 ? 'More volatile than market' : 'Less volatile than market'}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Value at Risk ({metrics?.varConfidence}%)</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(metrics?.valueAtRisk || 0)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Maximum 1-day potential loss</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Max Drawdown</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics?.maxDrawdown}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Largest peak-to-trough decline</div>
          </div>
        </div>

        {/* Risk Ratios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sharpe Ratio</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{metrics?.sharpeRatio}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                metrics?.sharpeRatio && metrics.sharpeRatio >= 1 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
              }`}>
                {metrics?.sharpeRatio && metrics.sharpeRatio >= 1 ? 'Good' : 'Moderate'}
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Risk-adjusted return measure. Higher is better. A ratio &gt;1 is considered good.
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sortino Ratio</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{metrics?.sortinoRatio}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                metrics?.sortinoRatio && metrics.sortinoRatio >= 1.5 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
              }`}>
                {metrics?.sortinoRatio && metrics.sortinoRatio >= 1.5 ? 'Excellent' : 'Good'}
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Downside risk-adjusted return. Focuses only on negative volatility.
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Concentration Risk</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{metrics?.concentrationRisk}%</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                metrics?.concentrationRisk && metrics.concentrationRisk > 25 ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              }`}>
                {metrics?.concentrationRisk && metrics.concentrationRisk > 25 ? 'High' : 'Low'}
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-300">Diversification</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Consider reducing exposure to your top holdings. AAPL represents over 28% of your portfolio.
                </p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-300">Risk-Adjusted Returns</h3>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Your Sharpe ratio of {metrics?.sharpeRatio} indicates good risk-adjusted performance.
                </p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-medium text-yellow-900 dark:text-yellow-300">Beta Exposure</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Your portfolio beta of {metrics?.betaCoefficient} means you have higher market sensitivity. Consider hedging.
                </p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <h3 className="font-medium text-purple-900 dark:text-purple-300">Value at Risk</h3>
                <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                  Your 1-day VaR is {formatCurrency(metrics?.valueAtRisk || 0)}. Ensure this aligns with your risk tolerance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Risk Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {settingsSaved ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Settings Saved!</h4>
                <p className="text-gray-600 dark:text-gray-400">Your risk settings have been updated.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stop-Loss Setting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Portfolio Stop-Loss Level (%)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={riskSettings.stopLossPercent}
                    onChange={(e) => setRiskSettings({...riskSettings, stopLossPercent: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>5% (Aggressive)</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{riskSettings.stopLossPercent}%</span>
                    <span>30% (Conservative)</span>
                  </div>
                </div>

                {/* Alert Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alert Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={riskSettings.alertThreshold}
                    onChange={(e) => setRiskSettings({...riskSettings, alertThreshold: parseInt(e.target.value) || 5})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Get notified when portfolio drops by this percentage
                  </p>
                </div>

                {/* Enable Alerts */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Enable Risk Alerts</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications for risk events</p>
                  </div>
                  <button
                    onClick={() => setRiskSettings({...riskSettings, alertsEnabled: !riskSettings.alertsEnabled})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      riskSettings.alertsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        riskSettings.alertsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Stop-Loss Protection:</strong> When your portfolio drops {riskSettings.stopLossPercent}% from its high, you'll receive an alert to review your positions.
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
