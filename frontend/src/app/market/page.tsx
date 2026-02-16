"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
interface Stock {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  current_price: number | null;
  change: number | null;
  change_percent: number | null;
  volume: number | null;
}

interface MarketIndex {
  id: number;
  symbol: string;
  name: string;
  current_value: number;
  change: number;
  change_percent: number;
}

interface WatchlistItem {
  id: number;
  stock: Stock;
  added_at: string;
  notes: string | null;
}

export default function MarketPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<Stock | null>(null);
  const [historicalData, setHistoricalData] = useState<any>([]);
  const [timeframe, setTimeframe] = useState('1M');
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Fetch market data on mount
  useEffect(() => {
    fetchMarketIndices();
    fetchWatchlist();
    setLoading(false);
  }, []);

  // Fetch market indices
  const fetchMarketIndices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/market/indices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMarketIndices(response.data);
    } catch (error) {
      console.error('Failed to fetch market indices:', error);
    }
  };

  // Fetch watchlist
  const fetchWatchlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/market/watchlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWatchlist(response.data);
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    }
  };

  // Search stocks
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/market/stocks/search?query=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(response.data.results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Select a stock
  const selectStock = async (stock: Stock) => {
    setSelectedIndex(stock);
    setSearchQuery('');
    setSearchResults([]);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/market/stock/${stock.symbol}/history?timeframe=${timeframe}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistoricalData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
    }
  };

  // Add to watchlist
  const addToWatchlist = async (stockId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/market/watchlist`,
        { stock_id: stockId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchWatchlist();
      alert('Added to watchlist!');
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      alert('Failed to add to watchlist');
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (watchlistId: number) => {
    if (!confirm('Remove from watchlist?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/market/watchlist/${watchlistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWatchlist();
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      alert('Failed to remove from watchlist');
    }
  };

  const formatPrice = (price: number | null) => {
    return price !== null ? `$${price.toFixed(2)}` : '-';
  };

  const formatChange = (change: number | null, percent: number | null) => {
    if (change === null || percent === null) return '-';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return 'text-gray-500';
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Data</h1>
          <p className="text-gray-600">Real-time stock prices and market information</p>
        </div>

        {/* Market Indices */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Indices</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {marketIndices.map((index) => (
              <div key={index.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
                <div className="text-sm text-gray-600 mb-1">{index.name}</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {index.current_value.toFixed(2)}
                </div>
                <div className={`text-sm font-medium ${getChangeColor(index.change)}`}>
                  {formatChange(index.change, index.change_percent)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search and Stock Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stocks by symbol or name..."
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchLoading && (
                  <div className="absolute right-3 top-3.5">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {searchResults.map((stock) => (
                    <div
                      key={stock.id}
                      onClick={() => selectStock(stock)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">{stock.symbol}</div>
                          <div className="text-sm text-gray-600">{stock.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{formatPrice(stock.current_price)}</div>
                          <div className={`text-sm font-medium ${getChangeColor(stock.change)}`}>
                            {formatChange(stock.change, stock.change_percent)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Stock Details */}
            {selectedIndex && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedIndex.symbol}</h2>
                    <p className="text-gray-600">{selectedIndex.name}</p>
                  </div>
                  <button
                    onClick={() => addToWatchlist(selectedIndex.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                  >
                    Add to Watchlist
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Current Price</div>
                    <div className="text-xl font-bold text-gray-900">{formatPrice(selectedIndex.current_price)}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Change</div>
                    <div className={`text-xl font-bold ${getChangeColor(selectedIndex.change)}`}>
                      {formatChange(selectedIndex.change, selectedIndex.change_percent)}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Volume</div>
                    <div className="text-xl font-bold text-gray-900">
                      {selectedIndex.volume?.toLocaleString() || '-'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Exchange</div>
                    <div className="text-xl font-bold text-gray-900">{selectedIndex.exchange}</div>
                  </div>
                </div>

                {/* Timeframe Selector */}
                <div className="flex space-x-2 mb-4">
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

                {/* Chart Placeholder */}
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <p>Historical data: {historicalData.length} data points</p>
                  <p className="text-sm">Chart visualization coming soon</p>
                </div>
              </div>
            )}
          </div>

          {/* Watchlist */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Watchlist</h2>

              {watchlist.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p>Your watchlist is empty</p>
                  <p className="text-sm">Search for stocks to add</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {watchlist.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-all">
                      <div className="flex justify-between items-start">
                        <button
                          onClick={() => selectStock(item.stock)}
                          className="flex-1 text-left"
                        >
                          <div className="font-semibold text-gray-900">{item.stock.symbol}</div>
                          <div className="text-sm text-gray-600 truncate">{item.stock.name}</div>
                        </button>
                        <button
                          onClick={() => removeFromWatchlist(item.id)}
                          className="text-gray-400 hover:text-red-600 ml-2"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className={`font-semibold ${getChangeColor(item.stock.change)}`}>
                          {formatChange(item.stock.change, item.stock.change_percent)}
                        </div>
                        <div className="text-gray-900 font-semibold">
                          {formatPrice(item.stock.current_price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
