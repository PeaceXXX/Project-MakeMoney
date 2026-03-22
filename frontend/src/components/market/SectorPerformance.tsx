import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SectorData {
  sector: string;
  avg_change: number;
  total_volume: number;
  market_cap: number;
  stock_count: number;
}

interface SectorPerformanceProps {
  className?: string;
}

const SectorPerformance: React.FC<SectorPerformanceProps> = ({ className = '' }) => {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'change' | 'volume' | 'market_cap'>('change');

  useEffect(() => {
    fetchSectorData();
    const interval = setInterval(fetchSectorData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [sortBy]);

  const fetchSectorData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/market/stocks/sectors');
      setSectors(response.data.sectors);
    } catch (err) {
      console.error('Error fetching sector data:', err);
      setError('Failed to fetch sector data');
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

  const getSectorBadgeColor = (change: number): string => {
    if (change > 2) return 'bg-green-100 text-green-800';
    if (change > 0) return 'bg-green-50 text-green-700';
    if (change > -2) return 'bg-red-50 text-red-700';
    return 'bg-red-100 text-red-800';
  };

  const sortedSectors = [...sectors].sort((a, b) => {
    if (sortBy === 'change') {
      return b.avg_change - a.avg_change;
    } else if (sortBy === 'volume') {
      return b.total_volume - a.total_volume;
    } else {
      return b.market_cap - a.market_cap;
    }
  });

  const heatmapColors = [
    'bg-red-100',
    'bg-red-200',
    'bg-red-300',
    'bg-gray-100',
    'bg-green-300',
    'bg-green-200',
    'bg-green-100',
  ];

  const getHeatmapColor = (change: number): string => {
    const index = Math.floor((change + 5) / 10 * (heatmapColors.length - 1));
    return heatmapColors[Math.max(0, Math.min(index, heatmapColors.length - 1))];
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Sector Performance</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setSortBy('change')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'change' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Change
          </button>
          <button
            onClick={() => setSortBy('volume')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'volume' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Volume
          </button>
          <button
            onClick={() => setSortBy('market_cap')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'market_cap' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Market Cap
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading sector data...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {sortedSectors.map((sector, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                {/* Sector Badge */}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSectorBadgeColor(sector.avg_change)}`}>
                  {sector.sector}
                </span>

                {/* Performance Indicator */}
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      sector.avg_change >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className={`font-medium ${getChangeColor(sector.avg_change)}`}>
                    {sector.avg_change >= 0 ? '+' : ''}{formatNumber(sector.avg_change)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                {/* Market Cap */}
                <div className="text-right">
                  <div className="text-gray-500">Market Cap</div>
                  <div className="font-medium">{formatLargeNumber(sector.market_cap)}</div>
                </div>

                {/* Volume */}
                <div className="text-right">
                  <div className="text-gray-500">Volume</div>
                  <div className="font-medium">{formatLargeNumber(sector.total_volume)}</div>
                </div>

                {/* Stock Count */}
                <div className="text-right">
                  <div className="text-gray-500">Stocks</div>
                  <div className="font-medium">{sector.stock_count}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && sectors.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No sector data available
        </div>
      )}

      {/* Heatmap Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Poor Performance</span>
          <div className="flex items-center space-x-1">
            {heatmapColors.map((color, index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-sm ${color}`}
                title={`${((index / (heatmapColors.length - 1)) * 10 - 5).toFixed(1)}%`}
              />
            ))}
          </div>
          <span>Strong Performance</span>
        </div>
      </div>
    </div>
  );
};

export default SectorPerformance;