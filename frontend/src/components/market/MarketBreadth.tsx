import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface MarketBreadthData {
  new_highs: number;
  new_lows: number;
  advancers: number;
  decliners: number;
  unchanged: number;
  total: number;
  advance_decline_ratio: number;
  timestamp: string;
}

interface MarketBreadthProps {
  className?: string;
}

const MarketBreadth: React.FC<MarketBreadthProps> = ({ className = '' }) => {
  const [breadthData, setBreadthData] = useState<MarketBreadthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBreadthData();
    const interval = setInterval(fetchBreadthData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchBreadthData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/market/breadth');
      setBreadthData(response.data);
    } catch (err) {
      console.error('Error fetching market breadth:', err);
      setError('Failed to fetch market breadth');
    } finally {
      setLoading(false);
    }
  };

  const getBreadthColor = (value: number, type: 'ad' | 'ny' = 'ad'): string => {
    if (type === 'ad') {
      if (value > 1.5) return 'text-green-600 bg-green-100';
      if (value > 1.1) return 'text-green-500 bg-green-50';
      if (value < 0.9) return 'text-red-600 bg-red-100';
      if (value < 0.7) return 'text-red-500 bg-red-50';
      return 'text-gray-600 bg-gray-100';
    } else {
      if (value > 60) return 'text-green-600 bg-green-100';
      if (value > 55) return 'text-green-500 bg-green-50';
      if (value < 40) return 'text-red-600 bg-red-100';
      if (value < 35) return 'text-red-500 bg-red-50';
      return 'text-gray-600 bg-gray-100';
    }
  };

  const getMarketSentiment = (): { text: string; color: string } => {
    if (!breadthData) return { text: 'Unknown', color: 'text-gray-600' };

    const adRatio = breadthData.advance_decline_ratio;
    const advancingPercent = (breadthData.advancers / breadthData.total) * 100;

    if (adRatio > 1.3 && advancingPercent > 60) {
      return { text: 'Very Bullish', color: 'text-green-600' };
    } else if (adRatio > 1.1 && advancingPercent > 55) {
      return { text: 'Bullish', color: 'text-green-500' };
    } else if (adRatio < 0.9 && advancingPercent < 45) {
      return { text: 'Bearish', color: 'text-red-500' };
    } else if (adRatio < 0.7 && advancingPercent < 40) {
      return { text: 'Very Bearish', color: 'text-red-600' };
    } else {
      return { text: 'Neutral', color: 'text-gray-600' };
    }
  };

  const formatNumber = (num: number): number => {
    return Math.round(num * 100) / 100;
  };

  const formatPercent = (num: number): string => {
    return `${formatNumber(num)}%`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading market breadth...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      </div>
    );
  }

  if (!breadthData) {
    return null;
  }

  const sentiment = getMarketSentiment();
  const advancingPercent = formatPercent((breadthData.advancers / breadthData.total) * 100);
  const decliningPercent = formatPercent((breadthData.decliners / breadthData.total) * 100);

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Market Breadth</h3>
        <p className={`text-sm mt-1 ${sentiment.color}`}>
          Market Sentiment: {sentiment.text}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Last updated: {new Date(breadthData.timestamp).toLocaleTimeString()}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {breadthData.advancers}
          </div>
          <div className="text-xs text-gray-600">Advancers</div>
          <div className="text-xs font-medium">{advancingPercent}</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {breadthData.decliners}
          </div>
          <div className="text-xs text-gray-600">Decliners</div>
          <div className="text-xs font-medium">{decliningPercent}</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {breadthData.unchanged}
          </div>
          <div className="text-xs text-gray-600">Unchanged</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold">
            {formatNumber(breadthData.advance_decline_ratio)}
          </div>
          <div className="text-xs text-gray-600">A/D Ratio</div>
        </div>
      </div>

      {/* Advance/Decline Line Visual */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Advance-Decline Distribution</h4>
        <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-1000"
            style={{
              width: `${(breadthData.advancers / breadthData.total) * 100}%`
            }}
          />
          <div
            className="absolute top-0 right-0 h-full bg-red-500 transition-all duration-1000"
            style={{
              width: `${(breadthData.decliners / breadthData.total) * 100}%`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Advancers</span>
          <span>Decliners</span>
        </div>
      </div>

      {/* New Highs/Lows */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">New Highs</span>
            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
              {formatNumber((breadthData.new_highs / breadthData.total) * 100)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {breadthData.new_highs}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Stocks at 52-week highs
          </div>
        </div>

        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">New Lows</span>
            <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
              {formatNumber((breadthData.new_lows / breadthData.total) * 100)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {breadthData.new_lows}
          </div>
          <div className="text-xs text-red-600 mt-1">
            Stocks at 52-week lows
          </div>
        </div>
      </div>

      {/* Breadth Indicators */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium mb-3">Breadth Indicators</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Bullish Breadth</span>
              <span className={`text-xs font-medium px-2 py-1 rounded ${getBreadthColor(breadthData.advance_decline_ratio, 'ad')}`}>
                {breadthData.advance_decline_ratio > 1 ? 'Strong' : 'Weak'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  breadthData.advance_decline_ratio > 1 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(breadthData.advance_decline_ratio * 50, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Market Participation</span>
              <span className={`text-xs font-medium px-2 py-1 rounded ${getBreadthColor((breadthData.advancers / breadthData.total) * 100, 'ny')}`}>
                {(breadthData.advancers / breadthData.total) > 0.6 ? 'High' : 'Low'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (breadthData.advancers / breadthData.total) > 0.6 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${(breadthData.advancers / breadthData.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketBreadth;