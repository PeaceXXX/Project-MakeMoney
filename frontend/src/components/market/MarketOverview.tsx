import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface MarketIndex {
  id: number;
  symbol: string;
  name: string;
  current_value: number;
  change: number;
  change_percent: number;
}

interface SectorData {
  sector: string;
  avg_change: number;
  total_volume: number;
  market_cap: number;
  stock_count: number;
}

interface MarketSnapshot {
  indices: MarketIndex[];
  top_gainers: Array<{
    symbol: string;
    name: string;
    change_percent: number;
    price: number;
    volume: number;
  }>;
  top_losers: Array<{
    symbol: string;
    name: string;
    change_percent: number;
    price: number;
    volume: number;
  }>;
  sectors: SectorData[];
  timestamp: string;
}

interface MarketStatus {
  is_market_open: boolean;
  message: string;
}

const MarketOverview: React.FC = () => {
  const [marketSnapshot, setMarketSnapshot] = useState<MarketSnapshot | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatus>({ is_market_open: false, message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch market overview
      const overviewResponse = await axios.get('/api/market/overview');
      setMarketSnapshot(overviewResponse.data);

      // Fetch market status
      const statusResponse = await axios.get('/api/market/realtime/status');
      setMarketStatus(statusResponse.data);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to fetch market data');
    } finally {
      setLoading(false);
    }
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

  const getMarketStatusColor = (): string => {
    return marketStatus.is_market_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  if (!marketSnapshot) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Market Status */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Market Overview</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMarketStatusColor()}`}>
            {marketStatus.message}
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Last updated: {new Date(marketSnapshot.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Major Indices */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-4">Major Indices</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketSnapshot.indices.map((index) => (
            <div key={index.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{index.symbol}</span>
                <span className={`text-sm ${getChangeColor(index.change)}`}>
                  {index.change >= 0 ? '+' : ''}{formatNumber(index.change_percent)}%
                </span>
              </div>
              <div className="text-2xl font-bold">
                {formatNumber(index.current_value)}
              </div>
              <div className={`text-sm ${getChangeColor(index.change)}`}>
                {index.change >= 0 ? '+' : ''}{formatNumber(index.change)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Gainers and Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-4 text-green-600">Top Gainers</h3>
          <div className="space-y-3">
            {marketSnapshot.top_gainers.slice(0, 5).map((stock, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{stock.symbol}</span>
                  <span className="text-sm text-gray-600">{stock.name}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getChangeColor(stock.change_percent)}`}>
                    +{formatNumber(stock.change_percent)}%
                  </div>
                  <div className="text-xs text-gray-500">{formatNumber(stock.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Top Losers</h3>
          <div className="space-y-3">
            {marketSnapshot.top_losers.slice(0, 5).map((stock, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{stock.symbol}</span>
                  <span className="text-sm text-gray-600">{stock.name}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getChangeColor(stock.change_percent)}`}>
                    {formatNumber(stock.change_percent)}%
                  </div>
                  <div className="text-xs text-gray-500">{formatNumber(stock.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Sectors */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-4">Top Performing Sectors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketSnapshot.sectors.slice(0, 6).map((sector, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${sector.avg_change >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{sector.sector}</span>
                <span className={`text-sm font-medium ${getChangeColor(sector.avg_change)}`}>
                  {sector.avg_change >= 0 ? '+' : ''}{formatNumber(sector.avg_change)}%
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {sector.stock_count} stocks
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;