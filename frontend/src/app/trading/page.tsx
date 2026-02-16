"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
type OrderSide = 'buy' | 'sell';
type OrderStatus = 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' | 'expired';

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

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
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

  useEffect(() => {
    fetchOrders();
  }, []);

  // Validate order
  const validateOrder = async () => {
    try {
      const token = localStorage.getItem('token');
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

      // Show confirmation
      setOrderToConfirm({
        symbol,
        order_type: orderType,
        side: orderSide,
        quantity: parseInt(quantity) || 0,
        limit_price: limitPrice ? parseFloat(limitPrice) : null,
        stop_price: stopPrice ? parseFloat(stopPrice) : null,
        estimated_price: limitPrice || stopPrice || 100 // Simulated price
      });
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
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/orders`, orderToConfirm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowConfirmation(false);
      setShowOrderForm(false);
      setOrderToConfirm(null);
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
      const token = localStorage.getItem('token');
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
                    <div className="grid grid-cols-2 gap-2">
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
                  </div>

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
      </div>

      {/* Order Confirmation Modal */}
      {showConfirmation && orderToConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Order</h3>
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
                  setOrderToConfirm(null);
                }}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmOrder}
                disabled={isSubmitting}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-all ${
                  orderToConfirm.side === 'buy'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
