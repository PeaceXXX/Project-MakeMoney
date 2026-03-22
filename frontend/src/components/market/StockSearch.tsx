import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

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

interface StockSearchProps {
  className?: string;
  onSelect?: (stock: Stock) => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ className = '', onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const searchStocks = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`/api/market/stocks/search/all`, {
          params: {
            query: searchQuery,
            limit: 20
          }
        });

        setResults(response.data.results || []);
        setShowResults(true);
      } catch (err) {
        console.error('Error searching stocks:', err);
        setError('Failed to search stocks');
        setResults([]);
        setShowResults(false);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchStocks(query);
  }, [query, searchStocks]);

  const handleSelect = (stock: Stock) => {
    setShowResults(false);
    setQuery('');
    setResults([]);
    onSelect?.(stock);
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals);
  };

  const formatLargeNumber = (num: number): string => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${formatNumber(num)}`;
  };

  const getChangeColor = (change: number): string => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getExchangeBadge = (exchange: string): string => {
    switch (exchange.toUpperCase()) {
      case 'NASDAQ':
        return 'bg-purple-100 text-purple-800';
      case 'NYSE':
        return 'bg-blue-100 text-blue-800';
      case 'NYSE ARCA':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder="Search stocks by symbol or company name..."
          className="w-full px-4 py-3 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-3 text-center text-gray-500 text-sm">
            <div className="inline-flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Searching...
            </div>
          </div>
        </div>
      )}

      {/* Search results */}
      {showResults && !loading && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="py-2">
            {results.map((stock, index) => (
              <div
                key={stock.id}
                onClick={() => handleSelect(stock)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{stock.symbol}</span>
                      <span className="text-sm text-gray-600">{stock.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getExchangeBadge(stock.exchange)}`}>
                        {stock.exchange}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{stock.sector}</span>
                      <span>•</span>
                      <span>{stock.industry}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {stock.current_price && (
                      <>
                        <div className="font-medium">
                          ${formatNumber(stock.current_price)}
                        </div>
                        <div
                          className={`text-sm font-medium ${getChangeColor(stock.change || 0)}`}
                        >
                          {stock.change_percent && (
                            <>
                              {stock.change_percent >= 0 ? '+' : ''}
                              {formatNumber(stock.change_percent)}%
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {stock.market_cap && (
                  <div className="text-xs text-gray-500 mt-1">
                    Market Cap: {formatLargeNumber(stock.market_cap)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {showResults && !loading && results.length === 0 && !error && query && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4 text-center text-gray-500 text-sm">
            No stocks found for "{query}"
          </div>
        </div>
      )}

      {/* Error message */}
      {error && showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-red-200 rounded-lg shadow-lg">
          <div className="p-4 text-center text-red-600 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setQuery('AAPL');
            searchStocks('AAPL');
          }}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Popular: Apple
        </button>
        <button
          onClick={() => {
            setQuery('MSFT');
            searchStocks('MSFT');
          }}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Popular: Microsoft
        </button>
        <button
          onClick={() => {
            setQuery('GOOGL');
            searchStocks('GOOGL');
          }}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Popular: Google
        </button>
        <button
          onClick={() => {
            setQuery('TSLA');
            searchStocks('TSLA');
          }}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Popular: Tesla
        </button>
      </div>

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};

export default StockSearch;