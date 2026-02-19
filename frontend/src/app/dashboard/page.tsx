"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import MainNav from '@/components/MainNav';

// Types
interface DashboardData {
  portfolioValue: number;
  portfolioChange: number;
  portfolioChangePercent: number;
  cashBalance: number;
  totalGain: number;
  totalGainPercent: number;
  holdingsCount: number;
  watchlistCount: number;
  pendingOrders: number;
}

interface Position {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  gain: number;
  gainPercent: number;
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchDashboardData();
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      // Mock implementation - replace with actual API calls
      // const [portfolioRes, positionsRes] = await Promise.all([
      //   axios.get(`${API_BASE}/portfolio/summary`, { headers: { Authorization: `Bearer ${token}` } }),
      //   axios.get(`${API_BASE}/portfolio/positions`, { headers: { Authorization: `Bearer ${token}` } })
      // ]);

      // Mock data
      setData({
        portfolioValue: 125750.00,
        portfolioChange: 1250.00,
        portfolioChangePercent: 1.0,
        cashBalance: 24250.00,
        totalGain: 25750.00,
        totalGainPercent: 25.75,
        holdingsCount: 8,
        watchlistCount: 12,
        pendingOrders: 3
      });

      setPositions([
        { symbol: 'AAPL', name: 'Apple Inc.', shares: 50, avgCost: 165.00, currentPrice: 178.50, gain: 675.00, gainPercent: 8.18 },
        { symbol: 'MSFT', name: 'Microsoft Corp', shares: 25, avgCost: 350.00, currentPrice: 378.90, gain: 722.50, gainPercent: 8.26 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 15, avgCost: 140.00, currentPrice: 145.20, gain: 78.00, gainPercent: 3.71 },
        { symbol: 'JPM', name: 'JPMorgan Chase', shares: 30, avgCost: 180.00, currentPrice: 195.40, gain: 462.00, gainPercent: 8.56 },
        { symbol: 'XOM', name: 'Exxon Mobil', shares: 40, avgCost: 95.00, currentPrice: 102.30, gain: 292.00, gainPercent: 7.68 }
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
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
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your portfolio overview.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Portfolio Value</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(data?.portfolioValue || 0)}</div>
            <div className={`text-sm font-medium ${getChangeColor(data?.portfolioChange || 0)}`}>
              {formatCurrency(data?.portfolioChange || 0)} ({formatPercent(data?.portfolioChangePercent || 0)}) today
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Cash Balance</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(data?.cashBalance || 0)}</div>
            <Link href="/trading" className="text-sm text-blue-600 hover:text-blue-800">Trade now →</Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Total Gain/Loss</div>
            <div className={`text-2xl font-bold ${getChangeColor(data?.totalGain || 0)}`}>
              {formatCurrency(data?.totalGain || 0)}
            </div>
            <div className={`text-sm ${getChangeColor(data?.totalGainPercent || 0)}`}>
              {formatPercent(data?.totalGainPercent || 0)} all time
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="text-sm text-gray-600 mb-1">Holdings</div>
                <div className="text-2xl font-bold text-gray-900">{data?.holdingsCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">{data?.pendingOrders}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Positions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Top Positions</h2>
                <Link href="/portfolio" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {positions.map((position) => (
                  <div key={position.symbol} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900">{position.symbol}</div>
                      <div className="text-sm text-gray-500">{position.shares} shares @ {formatCurrency(position.avgCost)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(position.currentPrice)}</div>
                      <div className={`text-sm font-medium ${getChangeColor(position.gain)}`}>
                        {formatCurrency(position.gain)} ({formatPercent(position.gainPercent)})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/trading"
                  className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                >
                  <svg className="h-5 w-5 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium text-blue-700">Place Order</span>
                </Link>

                <Link
                  href="/market"
                  className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-all"
                >
                  <svg className="h-5 w-5 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-medium text-green-700">Market Data</span>
                </Link>

                <Link
                  href="/alerts"
                  className="flex items-center p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-all"
                >
                  <svg className="h-5 w-5 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="font-medium text-yellow-700">Set Alerts</span>
                </Link>

                <Link
                  href="/performance"
                  className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all"
                >
                  <svg className="h-5 w-5 text-purple-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="font-medium text-purple-700">View Performance</span>
                </Link>
              </div>
            </div>

            {/* Watchlist Preview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Watchlist</h2>
                <Link href="/market" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Manage →
                </Link>
              </div>
              <div className="text-center py-6 text-gray-500">
                <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <p className="text-sm">{data?.watchlistCount} stocks on watchlist</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
