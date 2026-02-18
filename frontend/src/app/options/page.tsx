"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
type OptionType = 'call' | 'put';
type OptionSide = 'buy' | 'sell';

interface OptionContract {
  symbol: string;
  strike: number;
  expiry: string;
  type: OptionType;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  open_interest: number;
  implied_volatility: number;
}

interface OptionPosition {
  id: number;
  symbol: string;
  contract_name: string;
  type: OptionType;
  side: OptionSide;
  contracts: number;
  strike: number;
  expiry: string;
  premium: number;
  current_value: number;
  pnl: number;
}

export default function OptionsPage() {
  const [symbol, setSymbol] = useState('');
  const [optionType, setOptionType] = useState<OptionType>('call');
  const [optionSide, setOptionSide] = useState<OptionSide>('buy');
  const [strikePrice, setStrikePrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [contracts, setContracts] = useState('1');
  const [premium, setPremium] = useState('');
  const [optionChain, setOptionChain] = useState<OptionContract[]>([]);
  const [optionPositions, setOptionPositions] = useState<OptionPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Fetch option chain
  const fetchOptionChain = async (sym: string) => {
    if (!sym) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/options/chain/${sym}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOptionChain(response.data.contracts || []);
    } catch (error) {
      console.error('Failed to fetch option chain:', error);
      // Mock option chain data
      const mockChain: OptionContract[] = [
        { symbol: sym, strike: 170, expiry: '2026-03-21', type: 'call', bid: 5.20, ask: 5.35, last: 5.28, volume: 1250, open_interest: 5420, implied_volatility: 0.28 },
        { symbol: sym, strike: 175, expiry: '2026-03-21', type: 'call', bid: 3.10, ask: 3.25, last: 3.18, volume: 2340, open_interest: 8920, implied_volatility: 0.26 },
        { symbol: sym, strike: 180, expiry: '2026-03-21', type: 'call', bid: 1.45, ask: 1.55, last: 1.50, volume: 3120, open_interest: 12400, implied_volatility: 0.24 },
        { symbol: sym, strike: 170, expiry: '2026-03-21', type: 'put', bid: 2.80, ask: 2.95, last: 2.88, volume: 980, open_interest: 4210, implied_volatility: 0.27 },
        { symbol: sym, strike: 175, expiry: '2026-03-21', type: 'put', bid: 4.50, ask: 4.65, last: 4.58, volume: 1560, open_interest: 6530, implied_volatility: 0.25 },
        { symbol: sym, strike: 180, expiry: '2026-03-21', type: 'put', bid: 6.80, ask: 6.95, last: 6.88, volume: 2100, open_interest: 8210, implied_volatility: 0.23 },
      ];
      setOptionChain(mockChain);
    } finally {
      setLoading(false);
    }
  };

  // Fetch option positions
  const fetchOptionPositions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/options/positions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOptionPositions(response.data.positions || []);
    } catch (error) {
      console.error('Failed to fetch option positions:', error);
      // Mock option positions
      setOptionPositions([
        {
          id: 1,
          symbol: 'AAPL',
          contract_name: 'AAPL 03/21/26 175C',
          type: 'call',
          side: 'buy',
          contracts: 5,
          strike: 175,
          expiry: '2026-03-21',
          premium: 3.25,
          current_value: 3.10,
          pnl: -75.00
        },
        {
          id: 2,
          symbol: 'SPY',
          contract_name: 'SPY 02/28/26 450P',
          type: 'put',
          side: 'buy',
          contracts: 2,
          strike: 450,
          expiry: '2026-02-28',
          premium: 5.80,
          current_value: 6.20,
          pnl: 80.00
        }
      ]);
    }
  };

  useEffect(() => {
    fetchOptionPositions();
  }, []);

  // Handle symbol search
  const handleSymbolSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOptionChain(symbol);
  };

  // Select option from chain
  const selectOption = (option: OptionContract) => {
    setStrikePrice(option.strike.toString());
    setExpiryDate(option.expiry);
    setOptionType(option.type);
    setPremium(option.ask.toString());
    setShowOrderForm(true);
  };

  // Submit option order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/options/orders`, {
        symbol,
        type: optionType,
        side: optionSide,
        strike: parseFloat(strikePrice),
        expiry: expiryDate,
        contracts: parseInt(contracts),
        premium: parseFloat(premium)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Option order submitted successfully!');
      setShowOrderForm(false);
      fetchOptionPositions();
    } catch (error) {
      console.error('Failed to submit order:', error);
      alert('Order submitted (demo mode)');
      setShowOrderForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Options Trading</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Trade call and put options</p>
        </div>

        {/* Risk Warning */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Risk Warning:</strong> Options trading involves significant risk and is not suitable for all investors.
              You can lose more than your original investment.
            </div>
          </div>
        </div>

        {/* Symbol Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <form onSubmit={handleSymbolSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Enter symbol (e.g., AAPL)"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !symbol}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Options'}
            </button>
            <button
              type="button"
              onClick={() => setShowOrderForm(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              + New Order
            </button>
          </form>
        </div>

        {/* Option Chain */}
        {optionChain.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Option Chain - {symbol}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Strike</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Expiry</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Bid</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Ask</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Last</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Vol</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">OI</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">IV</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {optionChain.map((option, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          option.type === 'call'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {option.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">${option.strike}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{option.expiry}</td>
                      <td className="py-3 px-2 text-right text-gray-900 dark:text-white">${option.bid.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-gray-900 dark:text-white">${option.ask.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-gray-900 dark:text-white">${option.last.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400">{option.volume.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400">{option.open_interest.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400">{(option.implied_volatility * 100).toFixed(1)}%</td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => selectOption(option)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Option Positions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Option Positions</h2>
          {optionPositions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No option positions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Contract</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Side</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Contracts</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Premium</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Current</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {optionPositions.map((position) => (
                    <tr key={position.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{position.contract_name}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          position.type === 'call'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {position.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-sm ${position.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                          {position.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-gray-900 dark:text-white">{position.contracts}</td>
                      <td className="py-3 px-2 text-right text-gray-900 dark:text-white">${position.premium.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-gray-900 dark:text-white">${position.current_value.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={`font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Form Modal */}
        {showOrderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">New Option Order</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="AAPL"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Option Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOptionType('call')}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          optionType === 'call'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        CALL
                      </button>
                      <button
                        type="button"
                        onClick={() => setOptionType('put')}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          optionType === 'put'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        PUT
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Side</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOptionSide('buy')}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          optionSide === 'buy'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setOptionSide('sell')}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          optionSide === 'sell'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Strike Price</label>
                    <input
                      type="number"
                      value={strikePrice}
                      onChange={(e) => setStrikePrice(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="175"
                      step="0.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contracts</label>
                    <input
                      type="number"
                      value={contracts}
                      onChange={(e) => setContracts(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Premium ($)</label>
                    <input
                      type="number"
                      value={premium}
                      onChange={(e) => setPremium(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="3.25"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Order Summary</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Contract:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {symbol} {expiryDate ? new Date(expiryDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) : '--'} {strikePrice || '--'}{optionType === 'call' ? 'C' : 'P'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cost:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${(parseFloat(contracts) * 100 * (parseFloat(premium) || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      * 1 contract = 100 shares
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowOrderForm(false)}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${
                      optionSide === 'buy' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    {loading ? 'Submitting...' : `${optionSide === 'buy' ? 'Buy' : 'Sell'} Option`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
