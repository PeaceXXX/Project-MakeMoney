"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MainNav from '@/components/MainNav';
import MarketOverview from '@/components/market/MarketOverview';
import SectorPerformance from '@/components/market/SectorPerformance';
import MarketBreadth from '@/components/market/MarketBreadth';
import StockSearch from '@/components/market/StockSearch';

// Types
interface Stock {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
  current_price?: number | null;
  change?: number | null;
  change_percent?: number | null;
  volume?: number | null;
  market_cap?: number;
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

  // Real-time data states
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [realtimePrices, setRealtimePrices] = useState<Record<string, any>>({});

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'sectors' | 'breadth'>('overview');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Fetch market status
  const fetchMarketStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/market/realtime/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsMarketOpen(response.data.is_market_open);
    } catch (error) {
      console.error('Failed to fetch market status:', error);
    }
  }, [API_BASE]);

  // Fetch real-time quote for a single stock
  const fetchRealtimeQuote = useCallback(async (symbol: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/market/realtime/${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRealtimePrices(prev => ({
        ...prev,
        [symbol.toUpperCase()]: response.data
      }));
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(`Failed to fetch real-time quote for ${symbol}:`, error);
    }
  }, [API_BASE]);

  // Fetch real-time market indices
  const fetchRealtimeMarketIndices = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/market/realtime/indices/live`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.indices && response.data.indices.length > 0) {
        setMarketIndices(response.data.indices.map((idx: any) => ({
          id: idx.symbol,
          symbol: idx.symbol,
          name: idx.name,
          current_value: idx.current_value,
          change: idx.change,
          change_percent: idx.change_percent
        })));
        setIsMarketOpen(response.data.is_market_open);
      }
    } catch (error) {
      console.error('Failed to fetch real-time indices:', error);
    }
  }, [API_BASE]);

  // Fetch market indices (with real-time fallback)
  const fetchMarketIndices = useCallback(async () => {
    try {
      // Try real-time first
      await fetchRealtimeMarketIndices();
    } catch (error) {
      // Fallback to database
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_BASE}/market/indices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMarketIndices(response.data);
      } catch (dbError) {
        console.error('Failed to fetch market indices:', dbError);
      }
    }
  }, [API_BASE, fetchRealtimeMarketIndices]);

  // Fetch watchlist
  const fetchWatchlist = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/market/watchlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWatchlist(response.data);
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    }
  }, [API_BASE]);

  // Fetch market data on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    fetchMarketStatus();
    fetchMarketIndices();
    fetchWatchlist();
    setLoading(false);
  }, [fetchMarketStatus, fetchMarketIndices, fetchWatchlist]);

  // Real-time polling during market hours
  useEffect(() => {
    if (!isMarketOpen) return;

    // Poll for real-time data every 10 seconds during market hours
    const pollInterval = setInterval(() => {
      fetchRealtimeMarketIndices();
      if (selectedIndex) {
        fetchRealtimeQuote(selectedIndex.symbol);
      }
      // Update watchlist prices
      watchlist.forEach(item => {
        fetchRealtimeQuote(item.stock.symbol);
      });
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [isMarketOpen, selectedIndex, watchlist, fetchRealtimeMarketIndices, fetchRealtimeQuote]);

  // Search stocks
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const token = localStorage.getItem('access_token');
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
  }, [searchQuery, API_BASE]);

  // Select a stock
  const selectStock = async (stock: Stock) => {
    setSelectedIndex(stock);
    setSearchQuery('');
    setSearchResults([]);

    // Fetch real-time quote first
    await fetchRealtimeQuote(stock.symbol);

    // Fetch historical data from Yahoo Finance
    try {
      const token = localStorage.getItem('access_token');
      const periodMap: Record<string, string> = {
        '1D': '1d', '1W': '5d', '1M': '1mo', '3M': '3mo',
        '6M': '6mo', '1Y': '1y', 'ALL': 'max'
      };
      const response = await axios.get(
        `${API_BASE}/market/realtime/${stock.symbol}/history/live?period=${periodMap[timeframe] || '1mo'}&interval=1d`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistoricalData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch live historical data, trying fallback:', error);
      // Fallback to database historical data
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(
          `${API_BASE}/market/stock/${stock.symbol}/history?timeframe=${timeframe}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHistoricalData(response.data.data);
      } catch (fallbackError) {
        console.error('Failed to fetch historical data:', fallbackError);
      }
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
      const token = localStorage.getItem('access_token');
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
      const token = localStorage.getItem('access_token');
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
      const token = localStorage.getItem('access_token');
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
      const token = localStorage.getItem('access_token');
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
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE}/market/watchlist/${watchlistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWatchlist();
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      alert('Failed to remove from watchlist');
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    return price !== null && price !== undefined ? `$${price.toFixed(2)}` : '-';
  };

  const formatChange = (change: number | null | undefined, percent: number | null | undefined) => {
    if (change === null || change === undefined || percent === null || percent === undefined) return '-';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
  };

  const getChangeColor = (change: number | null | undefined) => {
    if (change === null || change === undefined) return 'text-gray-500';
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Calculate technical indicators
  const calculateSMA = useCallback((data: number[], period: number): number[] => {
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
  }, []);

  const calculateEMA = useCallback((data: number[], period: number): number[] => {
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
  }, []);

  const calculateRSI = useCallback((data: number[], period: number): number[] => {
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
  }, []);

  const calculateMACD = useCallback((data: number[], fast: number, slow: number, signal: number): { macd: number[], signal: number[], histogram: number[] } => {
    const emaFast = calculateEMA(data, fast);
    const emaSlow = calculateEMA(data, slow);
    const macdLine = emaFast.map((fastVal, i) => fastVal - emaSlow[i]);
    const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signal);
    const histogram = macdLine.map((macd, i) => {
      const signalIdx = i - (slow - 1);
      if (signalIdx < 0 || signalIdx >= signalLine.length) return NaN;
      return macd - signalLine[signalIdx];
    });

    return { macd: macdLine, signal: signalLine, histogram };
  }, [calculateEMA]);

  const calculateBollingerBands = useCallback((data: number[], period: number, stdDev: number): { upper: number[], middle: number[], lower: number[] } => {
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
  }, [calculateSMA]);

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
  }, [historicalData, activeIndicators, indicatorParams, calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands]);

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Data</h1>
              <p className="text-gray-600">Real-time US market data and comprehensive analysis</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Market Status Indicator */}
              <div className={`flex items-center px-4 py-2 rounded-full ${
                isMarketOpen
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  isMarketOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></span>
                <span className="text-sm font-medium">
                  {isMarketOpen ? 'Market Open' : 'Market Closed'}
                </span>
              </div>
              {/* Last Updated */}
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  Last updated: {lastUpdated}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg shadow-sm p-1">
            {[
              { id: 'overview', label: 'Market Overview', icon: '📊' },
              { id: 'sectors', label: 'Sector Performance', icon: '🏭' },
              { id: 'breadth', label: 'Market Breadth', icon: '📉' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <MarketOverview />
          )}

          {activeTab === 'sectors' && (
            <SectorPerformance />
          )}

          {activeTab === 'breadth' && (
            <MarketBreadth />
          )}
        </div>

        {/* Stock Search and Watchlist Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock Search */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Stocks</h2>
              <StockSearch onSelect={(stock) => { selectStock(stock); }} />

              {/* Selected Stock Details */}
              {selectedIndex && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedIndex.symbol}</h3>
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
                      <div className="text-xl font-bold text-gray-900">
                        {realtimePrices[selectedIndex.symbol.toUpperCase()]
                          ? `$${realtimePrices[selectedIndex.symbol.toUpperCase()].price?.toFixed(2) || formatPrice(selectedIndex.current_price)}`
                          : formatPrice(selectedIndex.current_price)}
                      </div>
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

                  {/* Historical Data Info */}
                  {historicalData.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        Historical data available: {historicalData.length} data points
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
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
                          {realtimePrices[item.stock.symbol.toUpperCase()]
                            ? `$${realtimePrices[item.stock.symbol.toUpperCase()].price?.toFixed(2) || formatPrice(item.stock.current_price)}`
                            : formatPrice(item.stock.current_price)}
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
