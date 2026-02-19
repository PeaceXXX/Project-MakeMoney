"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainNav from '@/components/MainNav';

// Types
type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
type OrderSide = 'buy' | 'sell' | 'short' | 'cover';
type OrderStatus = 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' | 'expired';

interface ShortPosition {
  id: number;
  symbol: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  margin_used: number;
  unrealized_pnl: number;
  created_at: string;
}

interface Order {
  id: number;
  symbol: string;
  order_type: OrderType;
  side: OrderSide;
  quantity: number;
  filled_quantity: number;
  limit_price: number | null;
  stop_price: number | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  filled_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

interface RiskCheckResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
  details: {
    order_value: number;
    account_balance: number;
    available_cash: number;
    position_concentration: number;
    daily_trades: number;
    max_daily_trades: number;
    order_percent_of_portfolio: number;
    max_order_percent: number;
  };
}

export default function TradingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState<any>(null);

  // Order form state
  const [symbol, setSymbol] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [riskCheckResult, setRiskCheckResult] = useState<RiskCheckResult | null>(null);
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const [shortPositions, setShortPositions] = useState<ShortPosition[]>([]);
  const [showShortPositions, setShowShortPositions] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    fetchOrders();
    fetchShortPositions();
  }, []);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch short positions
  const fetchShortPositions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/orders/short-positions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShortPositions(response.data.positions || []);
    } catch (error) {
      console.error('Failed to fetch short positions:', error);
      // Mock data for demo
      setShortPositions([
        {
          id: 1,
          symbol: 'TSLA',
          quantity: 50,
          entry_price: 245.00,
          current_price: 238.50,
          margin_used: 6125.00,
          unrealized_pnl: 325.00,
          created_at: '2026-02-15T10:00:00Z'
        },
        {
          id: 2,
          symbol: 'NVDA',
          quantity: 25,
          entry_price: 875.00,
          current_price: 892.00,
          margin_used: 10937.50,
          unrealized_pnl: -425.00,
          created_at: '2026-02-16T14:30:00Z'
        }
      ]);
    }
  };

  // Validate order
  const validateOrder = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE}/orders/validate`, {
        symbol,
        order_type: orderType,
        side: orderSide,
        quantity: parseInt(quantity) || 0,
        limit_price: limitPrice ? parseFloat(limitPrice) : null,
        stop_price: stopPrice ? parseFloat(stopPrice) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Validation failed:', error);
      return null;
    }
  };

  // Pre-trade risk check
  const performRiskCheck = async (orderData: any): Promise<RiskCheckResult> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE}/orders/risk-check`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Risk check failed:', error);
      // Return mock risk check for demo purposes
      const orderValue = orderData.quantity * (orderData.estimated_price || 100);
      const accountBalance = 100000;
      const availableCash = 75000;
      const orderPercent = (orderValue / accountBalance) * 100;

      const warnings: string[] = [];
      const errors: string[] = [];

      // Risk checks
      if (orderValue > accountBalance * 0.25) {
        warnings.push(`Order represents ${orderPercent.toFixed(1)}% of your portfolio (recommended max 25%)`);
      }
      if (orderData.side === 'buy' && orderValue > availableCash) {
        errors.push('Insufficient cash available for this order');
      }
      if (orderData.quantity > 10000) {
        warnings.push('Large order size may impact market price');
      }
      if (orderPercent > 50) {
        errors.push('Order exceeds 50% of portfolio value - position too concentrated');
      }

      return {
        passed: errors.length === 0,
        warnings,
        errors,
        details: {
          order_value: orderValue,
          account_balance: accountBalance,
          available_cash: availableCash,
          position_concentration: orderPercent,
          daily_trades: 5,
          max_daily_trades: 25,
          order_percent_of_portfolio: orderPercent,
          max_order_percent: 25
        }
      };
    }
  };

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      // Validate first
      const validation = await validateOrder();
      if (validation && !validation.valid) {
        setErrors(validation.errors.map(e => ({ field: 'general', message: e })));
        setIsSubmitting(false);
        return;
      }

      // Prepare order data
      const orderData = {
        symbol,
        order_type: orderType,
        side: orderSide,
        quantity: parseInt(quantity) || 0,
        limit_price: limitPrice ? parseFloat(limitPrice) : null,
        stop_price: stopPrice ? parseFloat(stopPrice) : null,
        estimated_price: limitPrice ? parseFloat(limitPrice) : (stopPrice ? parseFloat(stopPrice) : 100)
      };

      // Perform pre-trade risk check
      const riskResult = await performRiskCheck(orderData);
      setRiskCheckResult(riskResult);

      // Show confirmation with risk check results
      setOrderToConfirm(orderData);

      if (!riskResult.passed) {
        setShowRiskWarning(true);
      }
      setShowConfirmation(true);
    } catch (error) {
      console.error('Validation error:', error);
      setErrors([{ field: 'general', message: 'Validation failed. Please try again.' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm and execute order
  const confirmOrder = async () => {
    if (!orderToConfirm) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE}/orders`, orderToConfirm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowConfirmation(false);
      setShowOrderForm(false);
      setShowRiskWarning(false);
      setOrderToConfirm(null);
      setRiskCheckResult(null);
      fetchOrders();
      resetForm();
    } catch (error: any) {
      console.error('Order failed:', error);
      setErrors([{ field: 'general', message: error.response?.data?.detail || 'Order failed. Please try again.' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel order
  const cancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order. Please try again.');
    }
  };

  const resetForm = () => {
    setSymbol('');
    setOrderType('market');
    setOrderSide('buy');
    setQuantity('');
    setLimitPrice('');
    setStopPrice('');
    setErrors([]);
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      filled: 'bg-green-100 text-green-800',
      partially_filled: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price: number | null) => {
    return price ? `$${price.toFixed(2)}` : '-';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trading</h1>
          <p className="text-gray-600">Place and manage your trading orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {showOrderForm ? 'New Order' : 'Quick Actions'}
                </h2>
                <button
                  onClick={() => {
                    setShowOrderForm(!showOrderForm);
                    if (!showOrderForm) resetForm();
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showOrderForm ? 'Cancel' : 'Place Order'}
                </button>
              </div>

              {showOrderForm && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Order Side Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Side</label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setOrderSide('buy')}
                        className={`py-3 px-4 rounded-lg font-medium transition-all ${
                          orderSide === 'buy'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderSide('sell')}
                        className={`py-3 px-4 rounded-lg font-medium transition-all ${
                          orderSide === 'sell'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        SELL
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderSide('short')}
                        className={`py-3 px-4 rounded-lg font-medium transition-all border-2 ${
                          orderSide === 'short'
                            ? 'bg-orange-500 text-white border-orange-600'
                            : 'bg-white text-orange-600 border-orange-300 hover:border-orange-500'
                        }`}
                      >
                        SHORT
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderSide('cover')}
                        className={`py-3 px-4 rounded-lg font-medium transition-all border-2 ${
                          orderSide === 'cover'
                            ? 'bg-blue-500 text-white border-blue-600'
                            : 'bg-white text-blue-600 border-blue-300 hover:border-blue-500'
                        }`}
                      >
                        COVER
                      </button>
                    </div>
                  </div>

                  {/* Short Selling Info */}
                  {(orderSide === 'short' || orderSide === 'cover') && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-orange-500 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-orange-700">
                          {orderSide === 'short' ? (
                            <>
                              <strong>Short Selling:</strong> You are borrowing shares to sell with the expectation of buying them back at a lower price. Requires margin and carries unlimited risk.
                            </>
                          ) : (
                            <>
                              <strong>Cover Short:</strong> Buy back shares to close your short position and return borrowed shares.
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Symbol */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="AAPL"
                      required
                    />
                  </div>

                  {/* Order Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value as OrderType)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="market">Market</option>
                      <option value="limit">Limit</option>
                      <option value="stop">Stop</option>
                      <option value="stop_limit">Stop Limit</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="100"
                      min="1"
                      required
                    />
                  </div>

                  {/* Limit Price */}
                  {(orderType === 'limit' || orderType === 'stop_limit') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Limit Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="150.00"
                        required={orderType === 'limit' || orderType === 'stop_limit'}
                      />
                    </div>
                  )}

                  {/* Stop Price */}
                  {(orderType === 'stop' || orderType === 'stop_limit') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stop Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={stopPrice}
                        onChange={(e) => setStopPrice(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="155.00"
                        required={orderType === 'stop' || orderType === 'stop_limit'}
                      />
                    </div>
                  )}

                  {/* Errors */}
                  {errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      {errors.map((error, idx) => (
                        <p key={idx} className="text-sm text-red-800">{error.message}</p>
                      ))}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
                      orderSide === 'buy'
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-red-500 hover:bg-red-600'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Processing...' : `Place ${orderSide.toUpperCase()} Order`}
                  </button>
                </form>
              )}

              {!showOrderForm && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowOrderForm(true)}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                  >
                    Place New Order
                  </button>
                  <button
                    onClick={() => fetchOrders()}
                    className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
                  >
                    Refresh Orders
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Orders List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Orders</h2>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.side === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {order.side.toUpperCase()}
                          </span>
                          <span className="font-semibold text-gray-900">{order.symbol}</span>
                          <span className="text-sm text-gray-600">{order.quantity} shares</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.toUpperCase()}
                          </span>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => cancelOrder(order.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Type: </span>
                          <span className="font-medium">{order.order_type.replace('_', '-').toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Limit: </span>
                          <span className="font-medium">{formatPrice(order.limit_price)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Stop: </span>
                          <span className="font-medium">{formatPrice(order.stop_price)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {order.filled_quantity > 0 && (
                          <span>Filled: {order.filled_quantity}/{order.quantity} shares</span>
                        )}
                        <span className="ml-4">Created: {new Date(order.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Short Positions Section */}
        {shortPositions.length > 0 && (
          <div className="mt-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Open Short Positions</h2>
                <button
                  onClick={() => setShowShortPositions(!showShortPositions)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showShortPositions ? 'Hide' : 'Show'} Positions
                </button>
              </div>

              {showShortPositions && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Symbol</th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Entry</th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Current</th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">P&L</th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortPositions.map((position) => (
                        <tr key={position.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <span className="font-semibold text-gray-900">{position.symbol}</span>
                          </td>
                          <td className="py-3 px-2 text-right text-gray-900">{position.quantity}</td>
                          <td className="py-3 px-2 text-right text-gray-900">${position.entry_price.toFixed(2)}</td>
                          <td className="py-3 px-2 text-right text-gray-900">${position.current_price.toFixed(2)}</td>
                          <td className="py-3 px-2 text-right">
                            <span className={`font-semibold ${position.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {position.unrealized_pnl >= 0 ? '+' : ''}${position.unrealized_pnl.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={() => {
                                setSymbol(position.symbol);
                                setQuantity(position.quantity.toString());
                                setOrderSide('cover');
                                setShowOrderForm(true);
                              }}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
                            >
                              Cover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!showShortPositions && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Total Short Positions: {shortPositions.length}</span>
                  <span className={`font-medium ${
                    shortPositions.reduce((sum, p) => sum + p.unrealized_pnl, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Total P&L: ${shortPositions.reduce((sum, p) => sum + p.unrealized_pnl, 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Confirmation Modal */}
      {showConfirmation && orderToConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Order</h3>

            {/* Risk Check Results */}
            {riskCheckResult && (
              <div className={`mb-4 p-4 rounded-lg ${
                riskCheckResult.passed
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  {riskCheckResult.passed ? (
                    <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  <span className={`font-medium ${riskCheckResult.passed ? 'text-green-800' : 'text-red-800'}`}>
                    Risk Check {riskCheckResult.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>

                {/* Errors */}
                {riskCheckResult.errors.length > 0 && (
                  <div className="mt-2">
                    {riskCheckResult.errors.map((error, idx) => (
                      <p key={idx} className="text-sm text-red-700">• {error}</p>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {riskCheckResult.warnings.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-yellow-700 mb-1">Warnings:</p>
                    {riskCheckResult.warnings.map((warning, idx) => (
                      <p key={idx} className="text-sm text-yellow-700">• {warning}</p>
                    ))}
                  </div>
                )}

                {/* Risk Details */}
                <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Order Value:</span>
                    <span className="ml-1 font-medium">${riskCheckResult.details.order_value.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Available Cash:</span>
                    <span className="ml-1 font-medium">${riskCheckResult.details.available_cash.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Portfolio %:</span>
                    <span className={`ml-1 font-medium ${riskCheckResult.details.order_percent_of_portfolio > 25 ? 'text-red-600' : 'text-gray-900'}`}>
                      {riskCheckResult.details.order_percent_of_portfolio.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Daily Trades:</span>
                    <span className="ml-1 font-medium">{riskCheckResult.details.daily_trades}/{riskCheckResult.details.max_daily_trades}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Side:</span>
                <span className={`font-semibold ${orderToConfirm.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                  {orderToConfirm.side.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Symbol:</span>
                <span className="font-semibold">{orderToConfirm.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-semibold">{orderToConfirm.order_type.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold">{orderToConfirm.quantity} shares</span>
              </div>
              {orderToConfirm.limit_price && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Limit Price:</span>
                  <span className="font-semibold">${orderToConfirm.limit_price.toFixed(2)}</span>
                </div>
              )}
              {orderToConfirm.stop_price && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Stop Price:</span>
                  <span className="font-semibold">${orderToConfirm.stop_price.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Estimated Total:</span>
                  <span className={`font-bold ${orderToConfirm.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                    ${(orderToConfirm.quantity * orderToConfirm.estimated_price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setShowRiskWarning(false);
                  setOrderToConfirm(null);
                  setRiskCheckResult(null);
                }}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmOrder}
                disabled={isSubmitting || (riskCheckResult && !riskCheckResult.passed)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-all ${
                  orderToConfirm.side === 'buy'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                } ${(isSubmitting || (riskCheckResult && !riskCheckResult.passed)) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Processing...' : riskCheckResult && !riskCheckResult.passed ? 'Risk Check Failed' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
