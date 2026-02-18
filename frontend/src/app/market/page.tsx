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

interface TechnicalIndicator {
  name: string;
  displayName: string;
  params: Record<string, number>;
  values: number[];
}

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  related_symbols: string[];
}

interface FinancialData {
  symbol: string;
  fiscal_year: number;
  quarter: number | null;
  income_statement: {
    revenue: number;
    cost_of_revenue: number;
    gross_profit: number;
    operating_income: number;
    net_income: number;
    eps: number;
    eps_diluted: number;
  };
  balance_sheet: {
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    cash_and_equivalents: number;
    total_debt: number;
    current_assets: number;
    current_liabilities: number;
  };
  cash_flow: {
    operating_cash_flow: number;
    investing_cash_flow: number;
    financing_cash_flow: number;
    free_cash_flow: number;
    capital_expenditures: number;
    dividends_paid: number;
  };
  ratios: {
    pe_ratio: number;
    pb_ratio: number;
    debt_to_equity: number;
    current_ratio: number;
    roe: number;
    roa: number;
  };
}

interface InstitutionalTransaction {
  id: number;
  institution_name: string;
  transaction_type: 'buy' | 'sell';
  shares: number;
  price: number;
  total_value: number;
  transaction_date: string;
  filing_date: string;
  ownership_type: 'direct' | 'indirect';
}

interface IndicatorOption {
  id: string;
  name: string;
  type: 'overlay' | 'oscillator';
  defaultParams: Record<string, number>;
}

const INDICATOR_OPTIONS: IndicatorOption[] = [
  { id: 'sma', name: 'Simple Moving Average (SMA)', type: 'overlay', defaultParams: { period: 20 } },
  { id: 'ema', name: 'Exponential Moving Average (EMA)', type: 'overlay', defaultParams: { period: 20 } },
  { id: 'rsi', name: 'Relative Strength Index (RSI)', type: 'oscillator', defaultParams: { period: 14 } },
  { id: 'macd', name: 'MACD', type: 'oscillator', defaultParams: { fast: 12, slow: 26, signal: 9 } },
  { id: 'bb', name: 'Bollinger Bands', type: 'overlay', defaultParams: { period: 20, stdDev: 2 } },
];

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
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [indicatorParams, setIndicatorParams] = useState<Record<string, Record<string, number>>>({});
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);
  const [indicatorValues, setIndicatorValues] = useState<Record<string, TechnicalIndicator>>({});
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [financialsLoading, setFinancialsLoading] = useState(false);
  const [activeFinancialTab, setActiveFinancialTab] = useState<'income' | 'balance' | 'cashflow' | 'ratios'>('income');
  const [institutionalTransactions, setInstitutionalTransactions] = useState<InstitutionalTransaction[]>([]);
  const [institutionalLoading, setInstitutionalLoading] = useState(false);
  const [institutionalFilter, setInstitutionalFilter] = useState<'all' | 'buy' | 'sell'>('all');

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

    // Fetch news for selected stock
    fetchNews(stock.symbol);
    // Fetch financial data
    fetchFinancials(stock.symbol);
    // Fetch institutional transactions
    fetchInstitutional(stock.symbol);
  };

  // Fetch institutional transactions
  const fetchInstitutional = async (symbol: string) => {
    setInstitutionalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/market/stock/${symbol}/institutional`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInstitutionalTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch institutional transactions:', error);
      // Set mock institutional data for demo purposes
      setInstitutionalTransactions([
        {
          id: 1,
          institution_name: 'BlackRock Inc.',
          transaction_type: 'buy',
          shares: 2500000,
          price: 175.50,
          total_value: 438750000,
          transaction_date: '2025-01-15',
          filing_date: '2025-01-22',
          ownership_type: 'direct'
        },
        {
          id: 2,
          institution_name: 'Vanguard Group',
          transaction_type: 'buy',
          shares: 1800000,
          price: 174.25,
          total_value: 313650000,
          transaction_date: '2025-01-14',
          filing_date: '2025-01-21',
          ownership_type: 'direct'
        },
        {
          id: 3,
          institution_name: 'State Street Corporation',
          transaction_type: 'sell',
          shares: 950000,
          price: 176.80,
          total_value: 167960000,
          transaction_date: '2025-01-13',
          filing_date: '2025-01-20',
          ownership_type: 'direct'
        },
        {
          id: 4,
          institution_name: 'Fidelity Investments',
          transaction_type: 'buy',
          shares: 1200000,
          price: 173.90,
          total_value: 208680000,
          transaction_date: '2025-01-12',
          filing_date: '2025-01-19',
          ownership_type: 'indirect'
        },
        {
          id: 5,
          institution_name: 'Morgan Stanley',
          transaction_type: 'sell',
          shares: 650000,
          price: 177.25,
          total_value: 115212500,
          transaction_date: '2025-01-10',
          filing_date: '2025-01-17',
          ownership_type: 'direct'
        },
        {
          id: 6,
          institution_name: 'Goldman Sachs Group',
          transaction_type: 'buy',
          shares: 800000,
          price: 172.50,
          total_value: 138000000,
          transaction_date: '2025-01-09',
          filing_date: '2025-01-16',
          ownership_type: 'indirect'
        },
        {
          id: 7,
          institution_name: 'JP Morgan Chase',
          transaction_type: 'sell',
          shares: 420000,
          price: 178.10,
          total_value: 74802000,
          transaction_date: '2025-01-08',
          filing_date: '2025-01-15',
          ownership_type: 'direct'
        },
        {
          id: 8,
          institution_name: 'Capital World Investors',
          transaction_type: 'buy',
          shares: 550000,
          price: 171.80,
          total_value: 94490000,
          transaction_date: '2025-01-07',
          filing_date: '2025-01-14',
          ownership_type: 'direct'
        }
      ]);
    } finally {
      setInstitutionalLoading(false);
    }
  };

  // Fetch financial data
  const fetchFinancials = async (symbol: string) => {
    setFinancialsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/market/stock/${symbol}/financials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFinancialData(response.data);
    } catch (error) {
      console.error('Failed to fetch financials:', error);
      // Set mock financial data for demo purposes
      setFinancialData({
        symbol: symbol,
        fiscal_year: 2025,
        quarter: 4,
        income_statement: {
          revenue: 394328000000,
          cost_of_revenue: 224947000000,
          gross_profit: 169381000000,
          operating_income: 114925000000,
          net_income: 94960000000,
          eps: 6.11,
          eps_diluted: 6.05
        },
        balance_sheet: {
          total_assets: 352583000000,
          total_liabilities: 283263000000,
          total_equity: 69320000000,
          cash_and_equivalents: 29965000000,
          total_debt: 109280000000,
          current_assets: 135405000000,
          current_liabilities: 116866000000
        },
        cash_flow: {
          operating_cash_flow: 110543000000,
          investing_cash_flow: -4589000000,
          financing_cash_flow: -104900000000,
          free_cash_flow: 99584000000,
          capital_expenditures: 10959000000,
          dividends_paid: 15234000000
        },
        ratios: {
          pe_ratio: 29.5,
          pb_ratio: 42.3,
          debt_to_equity: 1.58,
          current_ratio: 1.16,
          roe: 0.147,
          roa: 0.278
        }
      });
    } finally {
      setFinancialsLoading(false);
    }
  };

  // Fetch news articles
  const fetchNews = async (symbol: string) => {
    setNewsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/market/news?symbol=${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewsArticles(response.data.articles || []);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      // Set mock news data for demo purposes
      setNewsArticles([
        {
          id: 1,
          title: `${symbol} Reports Strong Quarterly Earnings`,
          summary: `${symbol} exceeded analyst expectations with record revenue growth in the latest quarter.`,
          source: 'Financial Times',
          url: '#',
          published_at: new Date().toISOString(),
          sentiment: 'positive',
          related_symbols: [symbol]
        },
        {
          id: 2,
          title: `Analysts Upgrade ${symbol} Stock Rating`,
          summary: `Multiple analysts have raised their price targets for ${symbol} citing strong fundamentals.`,
          source: 'Bloomberg',
          url: '#',
          published_at: new Date(Date.now() - 86400000).toISOString(),
          sentiment: 'positive',
          related_symbols: [symbol]
        },
        {
          id: 3,
          title: `${symbol} Announces New Product Line`,
          summary: `The company unveiled its latest product offerings at a major industry event.`,
          source: 'Reuters',
          url: '#',
          published_at: new Date(Date.now() - 172800000).toISOString(),
          sentiment: 'neutral',
          related_symbols: [symbol]
        },
        {
          id: 4,
          title: `Market Watch: ${symbol} Trading Volume Surges`,
          summary: `Trading volume for ${symbol} has increased significantly over the past week.`,
          source: 'CNBC',
          url: '#',
          published_at: new Date(Date.now() - 259200000).toISOString(),
          sentiment: 'neutral',
          related_symbols: [symbol]
        },
        {
          id: 5,
          title: `${symbol} Faces Regulatory Scrutiny`,
          summary: `Regulators are examining the company's recent business practices.`,
          source: 'Wall Street Journal',
          url: '#',
          published_at: new Date(Date.now() - 345600000).toISOString(),
          sentiment: 'negative',
          related_symbols: [symbol]
        }
      ]);
    } finally {
      setNewsLoading(false);
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

  // Calculate technical indicators
  const calculateSMA = (data: number[], period: number): number[] => {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    return result;
  };

  const calculateEMA = (data: number[], period: number): number[] => {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else if (i === period - 1) {
        result.push(ema);
      } else {
        ema = (data[i] - ema) * multiplier + ema;
        result.push(ema);
      }
    }
    return result;
  };

  const calculateRSI = (data: number[], period: number): number[] => {
    const result: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        result.push(NaN);
      } else {
        const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        result.push(100 - (100 / (1 + rs)));
      }
    }
    return result;
  };

  const calculateMACD = (data: number[], fast: number, slow: number, signal: number): { macd: number[], signal: number[], histogram: number[] } => {
    const emaFast = calculateEMA(data, fast);
    const emaSlow = calculateEMA(data, slow);
    const macdLine = emaFast.map((fast, i) => fast - emaSlow[i]);
    const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signal);
    const histogram = macdLine.map((macd, i) => {
      const signalIdx = i - (slow - 1);
      if (signalIdx < 0 || signalIdx >= signalLine.length) return NaN;
      return macd - signalLine[signalIdx];
    });

    return { macd: macdLine, signal: signalLine, histogram };
  };

  const calculateBollingerBands = (data: number[], period: number, stdDev: number): { upper: number[], middle: number[], lower: number[] } => {
    const middle = calculateSMA(data, period);
    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        lower.push(NaN);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = middle[i];
        const squaredDiffs = slice.map(v => Math.pow(v - mean, 2));
        const std = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
        upper.push(mean + stdDev * std);
        lower.push(mean - stdDev * std);
      }
    }

    return { upper, middle, lower };
  };

  // Toggle indicator
  const toggleIndicator = (indicatorId: string) => {
    if (activeIndicators.includes(indicatorId)) {
      setActiveIndicators(activeIndicators.filter(id => id !== indicatorId));
      const newValues = { ...indicatorValues };
      delete newValues[indicatorId];
      setIndicatorValues(newValues);
    } else {
      const indicator = INDICATOR_OPTIONS.find(i => i.id === indicatorId);
      if (indicator) {
        setIndicatorParams(prev => ({
          ...prev,
          [indicatorId]: indicator.defaultParams
        }));
        setActiveIndicators([...activeIndicators, indicatorId]);
      }
    }
    setShowIndicatorModal(false);
  };

  // Recalculate indicators when data or params change
  useEffect(() => {
    if (historicalData.length === 0) return;

    const prices = historicalData.map((d: any) => d.close || d.price);
    const newValues: Record<string, TechnicalIndicator> = {};

    activeIndicators.forEach(indicatorId => {
      const params = indicatorParams[indicatorId] || INDICATOR_OPTIONS.find(i => i.id === indicatorId)?.defaultParams || {};

      switch (indicatorId) {
        case 'sma':
          newValues['sma'] = {
            name: 'sma',
            displayName: `SMA (${params.period})`,
            params,
            values: calculateSMA(prices, params.period)
          };
          break;
        case 'ema':
          newValues['ema'] = {
            name: 'ema',
            displayName: `EMA (${params.period})`,
            params,
            values: calculateEMA(prices, params.period)
          };
          break;
        case 'rsi':
          newValues['rsi'] = {
            name: 'rsi',
            displayName: `RSI (${params.period})`,
            params,
            values: calculateRSI(prices, params.period)
          };
          break;
        case 'macd':
          const macdResult = calculateMACD(prices, params.fast, params.slow, params.signal);
          newValues['macd'] = {
            name: 'macd',
            displayName: `MACD (${params.fast},${params.slow},${params.signal})`,
            params,
            values: macdResult.macd
          };
          break;
        case 'bb':
          const bbResult = calculateBollingerBands(prices, params.period, params.stdDev);
          newValues['bb'] = {
            name: 'bb',
            displayName: `Bollinger Bands (${params.period}, ${params.stdDev})`,
            params,
            values: bbResult.middle
          };
          break;
      }
    });

    setIndicatorValues(newValues);
  }, [historicalData, activeIndicators, indicatorParams]);

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

                {/* Technical Indicators Controls */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Technical Indicators</h3>
                    <button
                      onClick={() => setShowIndicatorModal(!showIndicatorModal)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Indicator
                    </button>
                  </div>

                  {/* Active Indicators */}
                  {activeIndicators.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {activeIndicators.map(indicatorId => {
                        const indicator = INDICATOR_OPTIONS.find(i => i.id === indicatorId);
                        const values = indicatorValues[indicatorId];
                        return (
                          <div
                            key={indicatorId}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                          >
                            <span>{values?.displayName || indicator?.name}</span>
                            <button
                              onClick={() => toggleIndicator(indicatorId)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Indicator Selection Modal */}
                  {showIndicatorModal && (
                    <div className="absolute z-10 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg">
                      <div className="p-3 border-b border-gray-100">
                        <h4 className="font-medium text-gray-900">Add Technical Indicator</h4>
                      </div>
                      <div className="p-2">
                        {INDICATOR_OPTIONS.map(indicator => (
                          <button
                            key={indicator.id}
                            onClick={() => toggleIndicator(indicator.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                              activeIndicators.includes(indicator.id)
                                ? 'bg-blue-50 text-blue-700'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className="font-medium">{indicator.name}</div>
                            <div className="text-xs text-gray-500">
                              {indicator.type === 'overlay' ? 'Overlay on chart' : 'Separate panel'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Chart Placeholder */}
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <p>Historical data: {historicalData.length} data points</p>
                  <p className="text-sm">Chart visualization coming soon</p>

                  {/* Indicator Values Display */}
                  {Object.keys(indicatorValues).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Current Indicator Values:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(indicatorValues).map(([id, indicator]) => {
                          const lastValue = indicator.values.filter(v => !isNaN(v)).pop();
                          return (
                            <div key={id} className="bg-white p-2 rounded border">
                              <span className="text-gray-600">{indicator.displayName}:</span>
                              <span className="ml-1 font-medium text-gray-900">
                                {lastValue !== undefined ? lastValue.toFixed(2) : 'N/A'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* RSI Panel */}
                {activeIndicators.includes('rsi') && indicatorValues['rsi'] && (
                  <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        {indicatorValues['rsi'].displayName}
                      </h4>
                      <span className="text-sm font-bold">
                        {(() => {
                          const lastValue = indicatorValues['rsi'].values.filter((v: number) => !isNaN(v)).pop();
                          if (lastValue === undefined) return 'N/A';
                          const color = lastValue > 70 ? 'text-red-600' : lastValue < 30 ? 'text-green-600' : 'text-gray-900';
                          return <span className={color}>{lastValue.toFixed(2)}</span>;
                        })()}
                      </span>
                    </div>
                    <div className="h-16 bg-gray-50 rounded relative">
                      <div className="absolute top-0 left-0 right-0 h-1/3 bg-red-100 opacity-30"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-green-100 opacity-30"></div>
                      <div className="absolute top-1/3 left-0 right-0 border-t border-dashed border-gray-300"></div>
                      <div className="absolute top-2/3 left-0 right-0 border-t border-dashed border-gray-300"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                        Overbought {'>'} 70 | Oversold {'<'} 30
                      </div>
                    </div>
                  </div>
                )}

                {/* MACD Panel */}
                {activeIndicators.includes('macd') && indicatorValues['macd'] && (
                  <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        {indicatorValues['macd'].displayName}
                      </h4>
                      <div className="text-sm">
                        <span className="text-gray-600 mr-2">MACD:</span>
                        <span className="font-bold">
                          {indicatorValues['macd'].values.filter((v: number) => !isNaN(v)).pop()?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="h-16 bg-gray-50 rounded flex items-center justify-center text-xs text-gray-400">
                      MACD histogram visualization
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* News Feed */}
            {selectedIndex && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Latest News for {selectedIndex.symbol}
                </h2>

                {newsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : newsArticles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <p>No recent news available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {newsArticles.map((article) => (
                      <a
                        key={article.id}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                article.sentiment === 'positive'
                                  ? 'bg-green-100 text-green-700'
                                  : article.sentiment === 'negative'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
                              </span>
                              <span className="text-xs text-gray-500">{article.source}</span>
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                              {article.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {article.summary}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(article.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Financial Data */}
            {selectedIndex && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Financial Data
                  </h2>
                  {financialData && (
                    <span className="text-sm text-gray-500">
                      FY {financialData.fiscal_year} {financialData.quarter ? `Q${financialData.quarter}` : ''}
                    </span>
                  )}
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-2 mb-4 border-b border-gray-200">
                  {[
                    { id: 'income', label: 'Income Statement' },
                    { id: 'balance', label: 'Balance Sheet' },
                    { id: 'cashflow', label: 'Cash Flow' },
                    { id: 'ratios', label: 'Ratios' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFinancialTab(tab.id as typeof activeFinancialTab)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                        activeFinancialTab === tab.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {financialsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : financialData ? (
                  <div>
                    {/* Income Statement Tab */}
                    {activeFinancialTab === 'income' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Revenue</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${(financialData.income_statement.revenue / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Cost of Revenue</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${(financialData.income_statement.cost_of_revenue / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Gross Profit</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${(financialData.income_statement.gross_profit / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Operating Income</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${(financialData.income_statement.operating_income / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-sm text-green-600">Net Income</div>
                          <div className="text-lg font-semibold text-green-700">
                            ${(financialData.income_statement.net_income / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">EPS (Diluted)</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${financialData.income_statement.eps_diluted.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Balance Sheet Tab */}
                    {activeFinancialTab === 'balance' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Total Assets</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${(financialData.balance_sheet.total_assets / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Total Liabilities</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${(financialData.balance_sheet.total_liabilities / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-600">Total Equity</div>
                          <div className="text-lg font-semibold text-blue-700">
                            ${(financialData.balance_sheet.total_equity / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Cash & Equivalents</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${(financialData.balance_sheet.cash_and_equivalents / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Total Debt</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${(financialData.balance_sheet.total_debt / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Current Ratio</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {(financialData.balance_sheet.current_assets / financialData.balance_sheet.current_liabilities).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cash Flow Tab */}
                    {activeFinancialTab === 'cashflow' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-sm text-green-600">Operating Cash Flow</div>
                          <div className="text-lg font-semibold text-green-700">
                            ${(financialData.cash_flow.operating_cash_flow / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Investing Cash Flow</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${(financialData.cash_flow.investing_cash_flow / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Financing Cash Flow</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${(financialData.cash_flow.financing_cash_flow / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-600">Free Cash Flow</div>
                          <div className="text-lg font-semibold text-blue-700">
                            ${(financialData.cash_flow.free_cash_flow / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Capital Expenditures</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${(financialData.cash_flow.capital_expenditures / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Dividends Paid</div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${(financialData.cash_flow.dividends_paid / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ratios Tab */}
                    {activeFinancialTab === 'ratios' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">P/E Ratio</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {financialData.ratios.pe_ratio.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">P/B Ratio</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {financialData.ratios.pb_ratio.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Debt to Equity</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {financialData.ratios.debt_to_equity.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Current Ratio</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {financialData.ratios.current_ratio.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-sm text-green-600">Return on Equity (ROE)</div>
                          <div className="text-lg font-semibold text-green-700">
                            {(financialData.ratios.roe * 100).toFixed(2)}%
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-600">Return on Assets (ROA)</div>
                          <div className="text-lg font-semibold text-blue-700">
                            {(financialData.ratios.roa * 100).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Financial data not available</p>
                  </div>
                )}
              </div>
            )}

            {/* Institutional Transactions */}
            {selectedIndex && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Institutional Transactions
                  </h2>
                  <div className="flex space-x-2">
                    {['all', 'buy', 'sell'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setInstitutionalFilter(filter as typeof institutionalFilter)}
                        className={`px-3 py-1 text-sm rounded-lg font-medium transition-all ${
                          institutionalFilter === filter
                            ? filter === 'buy'
                              ? 'bg-green-100 text-green-700'
                              : filter === 'sell'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {institutionalLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Institution</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Shares</th>
                          <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Value</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {institutionalTransactions
                          .filter(t => institutionalFilter === 'all' || t.transaction_type === institutionalFilter)
                          .map((transaction) => (
                            <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-2">
                                <div className="font-medium text-gray-900 text-sm">{transaction.institution_name}</div>
                                <div className="text-xs text-gray-500">{transaction.ownership_type}</div>
                              </td>
                              <td className="py-3 px-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                  transaction.transaction_type === 'buy'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {transaction.transaction_type.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-right text-sm text-gray-900">
                                {transaction.shares.toLocaleString()}
                              </td>
                              <td className="py-3 px-2 text-right text-sm text-gray-900">
                                ${transaction.price.toFixed(2)}
                              </td>
                              <td className="py-3 px-2 text-right text-sm font-medium text-gray-900">
                                ${(transaction.total_value / 1000000).toFixed(1)}M
                              </td>
                              <td className="py-3 px-2 text-sm text-gray-500">
                                {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>

                    {institutionalTransactions.filter(t => institutionalFilter === 'all' || t.transaction_type === institutionalFilter).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No transactions found</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary */}
                {!institutionalLoading && institutionalTransactions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Total Buy Value</div>
                      <div className="text-sm font-semibold text-green-600">
                        ${(institutionalTransactions
                          .filter(t => t.transaction_type === 'buy')
                          .reduce((sum, t) => sum + t.total_value, 0) / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Total Sell Value</div>
                      <div className="text-sm font-semibold text-red-600">
                        ${(institutionalTransactions
                          .filter(t => t.transaction_type === 'sell')
                          .reduce((sum, t) => sum + t.total_value, 0) / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Net Flow</div>
                      <div className={`text-sm font-semibold ${
                        institutionalTransactions
                          .filter(t => t.transaction_type === 'buy')
                          .reduce((sum, t) => sum + t.total_value, 0) -
                        institutionalTransactions
                          .filter(t => t.transaction_type === 'sell')
                          .reduce((sum, t) => sum + t.total_value, 0) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        ${((institutionalTransactions
                          .filter(t => t.transaction_type === 'buy')
                          .reduce((sum, t) => sum + t.total_value, 0) -
                          institutionalTransactions
                          .filter(t => t.transaction_type === 'sell')
                          .reduce((sum, t) => sum + t.total_value, 0)) / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  </div>
                )}
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
