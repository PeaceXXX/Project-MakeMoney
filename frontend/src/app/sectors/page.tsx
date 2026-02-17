"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
interface SectorPerformance {
  sector: string;
  change: number;
  changePercent: number;
  marketCap: number;
  topStock: string;
  topStockChange: number;
  volume: number;
}

export default function SectorsPage() {
  const [sectors, setSectors] = useState<SectorPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Fetch sector performance
  const fetchSectorPerformance = async () => {
    try {
      // Mock implementation
      setSectors([
        { sector: 'Technology', change: 125.5, changePercent: 1.8, marketCap: 12500000000000, topStock: 'NVDA', topStockChange: 4.2, volume: 85000000 },
        { sector: 'Healthcare', change: 45.2, changePercent: 0.9, marketCap: 5200000000000, topStock: 'UNH', topStockChange: 2.1, volume: 28000000 },
        { sector: 'Financial', change: -32.8, changePercent: -0.6, marketCap: 8100000000000, topStock: 'JPM', topStockChange: -0.5, volume: 42000000 },
        { sector: 'Consumer Discretionary', change: 78.3, changePercent: 1.2, marketCap: 6500000000000, topStock: 'AMZN', topStockChange: 2.8, volume: 55000000 },
        { sector: 'Consumer Staples', change: 15.6, changePercent: 0.4, marketCap: 3800000000000, topStock: 'PG', topStockChange: 0.8, volume: 18000000 },
        { sector: 'Energy', change: 92.1, changePercent: 2.1, marketCap: 4200000000000, topStock: 'XOM', topStockChange: 3.5, volume: 35000000 },
        { sector: 'Industrial', change: 28.4, changePercent: 0.5, marketCap: 5800000000000, topStock: 'CAT', topStockChange: 1.2, volume: 22000000 },
        { sector: 'Utilities', change: -8.2, changePercent: -0.3, marketCap: 1500000000000, topStock: 'NEE', topStockChange: -0.2, volume: 8000000 },
        { sector: 'Real Estate', change: 12.5, changePercent: 0.6, marketCap: 1800000000000, topStock: 'AMT', topStockChange: 1.1, volume: 12000000 },
        { sector: 'Materials', change: 35.7, changePercent: 0.8, marketCap: 2200000000000, topStock: 'LIN', topStockChange: 1.5, volume: 15000000 },
        { sector: 'Communication', change: 55.2, changePercent: 1.4, marketCap: 4500000000000, topStock: 'GOOGL', topStockChange: 1.9, volume: 25000000 }
      ]);
    } catch (error) {
      console.error('Failed to fetch sector performance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectorPerformance();
  }, []);

  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeBgColor = (change: number) => {
    return change >= 0 ? 'bg-green-50' : 'bg-red-50';
  };

  // Sort by performance
  const sortedSectors = [...sectors].sort((a, b) => b.changePercent - a.changePercent);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sector Performance</h1>
          <p className="text-gray-600">Market sector breakdown and performance analysis</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Best Performing</div>
            <div className="text-xl font-bold text-green-600">
              {sortedSectors[0]?.sector || '-'}
            </div>
            <div className="text-sm text-green-600">
              +{sortedSectors[0]?.changePercent.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Worst Performing</div>
            <div className="text-xl font-bold text-red-600">
              {sortedSectors[sortedSectors.length - 1]?.sector || '-'}
            </div>
            <div className="text-sm text-red-600">
              {sortedSectors[sortedSectors.length - 1]?.changePercent.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Advancing Sectors</div>
            <div className="text-xl font-bold text-gray-900">
              {sectors.filter(s => s.changePercent > 0).length} / {sectors.length}
            </div>
            <div className="text-sm text-gray-500">
              {((sectors.filter(s => s.changePercent > 0).length / sectors.length) * 100).toFixed(0)}% positive
            </div>
          </div>
        </div>

        {/* Sector Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSectors.map((sector) => (
                <tr key={sector.sector} className={`hover:bg-gray-50 ${getChangeBgColor(sector.changePercent)}`}>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                    {sector.sector}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${getChangeColor(sector.change)}`}>
                    {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${getChangeColor(sector.changePercent)}`}>
                    {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatLargeNumber(sector.marketCap)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{sector.topStock}</span>
                    <span className={`ml-2 text-sm ${getChangeColor(sector.topStockChange)}`}>
                      ({sector.topStockChange >= 0 ? '+' : ''}{sector.topStockChange.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatVolume(sector.volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visual Chart Placeholder */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sector Allocation Chart</h2>
          <div className="bg-gray-50 rounded-lg p-12 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <p>Sector allocation pie chart coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
