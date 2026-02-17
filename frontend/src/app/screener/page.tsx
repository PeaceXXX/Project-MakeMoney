"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  peRatio: number | null;
  dividendYield: number | null;
}

interface FilterCriteria {
  minPrice: string;
  maxPrice: string;
  minMarketCap: string;
  maxMarketCap: string;
  sector: string;
  minVolume: string;
  minPE: string;
  maxPE: string;
  minDividendYield: string;
}

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterCriteria>({
    minPrice: '',
    maxPrice: '',
    minMarketCap: '',
    maxMarketCap: '',
    sector: 'all',
    minVolume: '',
    minPE: '',
    maxPE: '',
    minDividendYield: ''
  });
  const [showFilters, setShowFilters] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Fetch stocks
  const fetchStocks = async () => {
    try {
      const token = localStorage.getItem('token');
      // Mock implementation - replace with actual API call
      // const response = await axios.get(`${API_BASE}/market/screener`, {
      //   headers: { Authorization: `Bearer ${token}` },
      //   params: filters
      // });
      // setStocks(response.data.stocks);

      // Mock data for demonstration
      setStocks([
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          price: 178.50,
          change: 2.30,
          changePercent: 1.30,
          volume: 55000000,
          marketCap: 2800000000000,
          sector: 'Technology',
          peRatio: 28.5,
          dividendYield: 0.5
        },
        {
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          price: 378.90,
          change: 5.20,
          changePercent: 1.39,
          volume: 22000000,
          marketCap: 2800000000000,
          sector: 'Technology',
          peRatio: 35.2,
          dividendYield: 0.8
        },
        {
          symbol: 'JPM',
          name: 'JPMorgan Chase & Co.',
          price: 195.40,
          change: -1.20,
          changePercent: -0.61,
          volume: 8500000,
          marketCap: 560000000000,
          sector: 'Financial',
          peRatio: 11.2,
          dividendYield: 2.4
        },
        {
          symbol: 'JNJ',
          name: 'Johnson & Johnson',
          price: 158.70,
          change: 0.85,
          changePercent: 0.54,
          volume: 6200000,
          marketCap: 380000000000,
          sector: 'Healthcare',
          peRatio: 15.8,
          dividendYield: 2.9
        },
        {
          symbol: 'XOM',
          name: 'Exxon Mobil Corporation',
          price: 102.30,
          change: 1.50,
          changePercent: 1.49,
          volume: 15000000,
          marketCap: 410000000000,
          sector: 'Energy',
          peRatio: 9.5,
          dividendYield: 3.4
        },
        {
          symbol: 'PG',
          name: 'Procter & Gamble Co.',
          price: 145.80,
          change: 0.40,
          changePercent: 0.28,
          volume: 5800000,
          marketCap: 340000000000,
          sector: 'Consumer Staples',
          peRatio: 24.3,
          dividendYield: 2.5
        },
        {
          symbol: 'AMZN',
          name: 'Amazon.com Inc.',
          price: 178.25,
          change: 3.80,
          changePercent: 2.18,
          volume: 42000000,
          marketCap: 1850000000000,
          sector: 'Technology',
          peRatio: 62.5,
          dividendYield: null
        },
        {
          symbol: 'V',
          name: 'Visa Inc.',
          price: 265.40,
          change: 2.10,
          changePercent: 0.80,
          volume: 7100000,
          marketCap: 530000000000,
          sector: 'Financial',
          peRatio: 29.8,
          dividendYield: 0.8
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

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

  // Filter stocks
  const filteredStocks = stocks.filter(stock => {
    if (filters.minPrice && stock.price < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && stock.price > parseFloat(filters.maxPrice)) return false;
    if (filters.minMarketCap && stock.marketCap < parseFloat(filters.minMarketCap) * 1e9) return false;
    if (filters.maxMarketCap && stock.marketCap > parseFloat(filters.maxMarketCap) * 1e9) return false;
    if (filters.sector !== 'all' && stock.sector !== filters.sector) return false;
    if (filters.minVolume && stock.volume < parseFloat(filters.minVolume) * 1e6) return false;
    if (filters.minPE && (stock.peRatio === null || stock.peRatio < parseFloat(filters.minPE))) return false;
    if (filters.maxPE && (stock.peRatio === null || stock.peRatio > parseFloat(filters.maxPE))) return false;
    if (filters.minDividendYield && (stock.dividendYield === null || stock.dividendYield < parseFloat(filters.minDividendYield))) return false;
    return true;
  });

  // Sort by market cap
  const sortedStocks = [...filteredStocks].sort((a, b) => b.marketCap - a.marketCap);

  const sectors = ['all', 'Technology', 'Financial', 'Healthcare', 'Energy', 'Consumer Staples', 'Consumer Discretionary', 'Industrial', 'Utilities', 'Real Estate'];

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      minMarketCap: '',
      maxMarketCap: '',
      sector: 'all',
      minVolume: '',
      minPE: '',
      maxPE: '',
      minDividendYield: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Screener</h1>
          <p className="text-gray-600">Find stocks that match your investment criteria</p>
        </div>

        {/* Toggle Filters Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="$0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="$1000"
                />
              </div>

              {/* Market Cap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Market Cap (B)</label>
                <input
                  type="number"
                  value={filters.minMarketCap}
                  onChange={(e) => setFilters({...filters, minMarketCap: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Market Cap (B)</label>
                <input
                  type="number"
                  value={filters.maxMarketCap}
                  onChange={(e) => setFilters({...filters, maxMarketCap: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1000"
                />
              </div>

              {/* Sector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                <select
                  value={filters.sector}
                  onChange={(e) => setFilters({...filters, sector: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {sectors.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector === 'all' ? 'All Sectors' : sector}
                    </option>
                  ))}
                </select>
              </div>

              {/* Volume */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Volume (M)</label>
                <input
                  type="number"
                  value={filters.minVolume}
                  onChange={(e) => setFilters({...filters, minVolume: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
              </div>

              {/* P/E Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min P/E Ratio</label>
                <input
                  type="number"
                  value={filters.minPE}
                  onChange={(e) => setFilters({...filters, minPE: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max P/E Ratio</label>
                <input
                  type="number"
                  value={filters.maxPE}
                  onChange={(e) => setFilters({...filters, maxPE: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                />
              </div>

              {/* Dividend Yield */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Dividend Yield (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={filters.minDividendYield}
                  onChange={(e) => setFilters({...filters, minDividendYield: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2"
                />
              </div>

              {/* Clear Button */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {sortedStocks.length} of {stocks.length} stocks
        </div>

        {/* Results Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : sortedStocks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stocks match your criteria</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">P/E</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Div Yield</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedStocks.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{stock.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stock.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">{formatCurrency(stock.price)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${getChangeColor(stock.change)}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{formatVolume(stock.volume)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{formatLargeNumber(stock.marketCap)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stock.sector}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{stock.peRatio?.toFixed(1) || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{stock.dividendYield ? `${stock.dividendYield.toFixed(1)}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
