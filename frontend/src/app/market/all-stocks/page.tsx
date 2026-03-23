"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MainNav from '@/components/MainNav';

interface Stock {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  current_price?: number;
  change?: number;
  change_percent?: number;
  volume?: number;
  market_cap?: number;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

const AllStocksPage: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(100);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'name' | 'price' | 'change_percent' | 'volume' | 'market_cap'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterSector, setFilterSector] = useState<string>('');
  const [filterExchange, setFilterExchange] = useState<string>('');

  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
        search: searchQuery,
        sort_by: sortBy,
        sort_order: sortOrder,
        sector: filterSector,
        exchange: filterExchange
      });

      const token = localStorage.getItem('access_token');
      const response = await axios.get(`/api/market/stocks/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStocks(response.data.stocks || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError('Failed to fetch stocks');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, sortBy, sortOrder, filterSector, filterExchange]);

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchStocks]);

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number, percent: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
  };

  const formatLargeNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const getChangeColor = (change: number): string => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleSort = (field: 'symbol' | 'name' | 'price' | 'change_percent' | 'volume' | 'market_cap') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sectors = [...new Set(stocks.map(s => s.sector))].filter(Boolean);

  const exchanges = [...new Set(stocks.map(s => s.exchange))].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">All US Stocks</h1>
              <p className="text-gray-600">
                Comprehensive view of all US market stocks with real-time data
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search stocks by symbol or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sector Filter */}
            <div>
              <select
                value={filterSector}
                onChange={(e) => {
                  setFilterSector(e.target.value);
                  setPage(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sectors</option>
                {sectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            {/* Exchange Filter */}
            <div>
              <select
                value={filterExchange}
                onChange={(e) => {
                  setFilterExchange(e.target.value);
                  setPage(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Exchanges</option>
                {exchanges.map(exchange => (
                  <option key={exchange} value={exchange}>{exchange}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stock Grid */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading stocks...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-600">{error}</div>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 uppercase">
                  <button
                    onClick={() => handleSort('symbol')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Symbol</span>
                    {sortBy === 'symbol' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Name</span>
                    {sortBy === 'name' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('price')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Price</span>
                    {sortBy === 'price' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('change_percent')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Change</span>
                    {sortBy === 'change_percent' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('volume')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Volume</span>
                    {sortBy === 'volume' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('market_cap')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Market Cap</span>
                    {sortBy === 'market_cap' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {stocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div>
                        <div className="font-semibold text-gray-900">{stock.symbol}</div>
                        <div className="text-xs text-gray-500">{stock.exchange}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-700 truncate">{stock.name}</div>
                        <div className="text-xs text-gray-500">{stock.sector}</div>
                      </div>
                      <div className="font-medium text-gray-900">
                        {stock.current_price ? formatPrice(stock.current_price) : '-'}
                      </div>
                      <div className={`font-medium ${getChangeColor(stock.change || 0)}`}>
                        {stock.change_percent !== undefined && stock.change !== undefined
                          ? formatChange(stock.change, stock.change_percent)
                          : '-'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {stock.volume ? formatLargeNumber(stock.volume) : '-'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {stock.market_cap ? formatLargeNumber(stock.market_cap) : '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{page * limit + 1}</span> to{' '}
                    <span className="font-medium">{Math.min((page + 1) * limit, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="px-3 py-1 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-300 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * limit >= total}
                      className="px-3 py-1 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllStocksPage;