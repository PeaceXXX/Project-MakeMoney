"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
interface Alert {
  id: number;
  symbol: string;
  alert_type: 'price' | 'volume' | 'percentage_change';
  condition: 'above' | 'below';
  target_value: number;
  is_active: boolean;
  created_at: string;
  triggered_at: string | null;
}

interface AlertFormData {
  symbol: string;
  alert_type: 'price' | 'volume' | 'percentage_change';
  condition: 'above' | 'below';
  target_value: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [alertForm, setAlertForm] = useState<AlertFormData>({
    symbol: '',
    alert_type: 'price',
    condition: 'above',
    target_value: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      // Mock implementation - replace with actual API call
      // const response = await axios.get(`${API_BASE}/alerts`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // setAlerts(response.data.alerts);

      // Mock data for demonstration
      setAlerts([
        {
          id: 1,
          symbol: 'AAPL',
          alert_type: 'price',
          condition: 'above',
          target_value: 175.00,
          is_active: true,
          created_at: new Date().toISOString(),
          triggered_at: null
        },
        {
          id: 2,
          symbol: 'MSFT',
          alert_type: 'percentage_change',
          condition: 'above',
          target_value: 5.0,
          is_active: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          triggered_at: null
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Create alert
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      // Mock implementation - replace with actual API call
      // await axios.post(`${API_BASE}/alerts`, {
      //   ...alertForm,
      //   target_value: parseFloat(alertForm.target_value)
      // }, { headers: { Authorization: `Bearer ${token}` } });

      // Mock success
      const newAlert: Alert = {
        id: Date.now(),
        symbol: alertForm.symbol.toUpperCase(),
        alert_type: alertForm.alert_type,
        condition: alertForm.condition,
        target_value: parseFloat(alertForm.target_value),
        is_active: true,
        created_at: new Date().toISOString(),
        triggered_at: null
      };
      setAlerts([...alerts, newAlert]);
      setShowCreateModal(false);
      resetForm();
      alert('Alert created successfully!');
    } catch (error) {
      console.error('Failed to create alert:', error);
      alert('Failed to create alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete alert
  const handleDeleteAlert = async (alertId: number) => {
    if (!confirm('Delete this alert?')) return;

    setIsDeleting(alertId);
    try {
      const token = localStorage.getItem('token');
      // Mock implementation - replace with actual API call
      // await axios.delete(`${API_BASE}/alerts/${alertId}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      // Mock success
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to delete alert:', error);
      alert('Failed to delete alert');
    } finally {
      setIsDeleting(null);
    }
  };

  const resetForm = () => {
    setAlertForm({
      symbol: '',
      alert_type: 'price',
      condition: 'above',
      target_value: ''
    });
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'price': 'Price',
      'volume': 'Volume',
      'percentage_change': '% Change'
    };
    return labels[type] || type;
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      'above': 'Above',
      'below': 'Below'
    };
    return labels[condition] || condition;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Price Alerts</h1>
            <p className="text-gray-600">Get notified when stocks hit your target price</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
          >
            Create Alert
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About Alerts</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>Set price, volume, or percentage change alerts for your watchlist stocks. You'll receive notifications when conditions are met.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts yet</h3>
            <p className="text-gray-500">Create your first alert to stay informed about price movements</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{alert.symbol}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        alert.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alert.is_active ? 'Active' : 'Triggered'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        Alert when {alert.symbol} goes <strong>{getConditionLabel(alert.condition)}</strong>{' '}
                        <strong>{getAlertTypeLabel(alert.alert_type)}</strong> of{' '}
                        <strong className="text-gray-900">${alert.target_value.toFixed(2)}</strong>
                      </p>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Created: {new Date(alert.created_at).toLocaleDateString()}
                      {alert.triggered_at && (
                        <span className="ml-4">Triggered: {new Date(alert.triggered_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  {alert.is_active && (
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      disabled={isDeleting === alert.id}
                      className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Price Alert</h3>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Symbol</label>
                <input
                  type="text"
                  value={alertForm.symbol}
                  onChange={(e) => setAlertForm({...alertForm, symbol: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="AAPL"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
                <select
                  value={alertForm.alert_type}
                  onChange={(e) => setAlertForm({...alertForm, alert_type: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="price">Price</option>
                  <option value="volume">Volume</option>
                  <option value="percentage_change">Percentage Change</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAlertForm({...alertForm, condition: 'above'})}
                    className={`py-3 px-4 rounded-lg font-medium transition-all ${
                      alertForm.condition === 'above'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Goes Above
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertForm({...alertForm, condition: 'below'})}
                    className={`py-3 px-4 rounded-lg font-medium transition-all ${
                      alertForm.condition === 'below'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Goes Below
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={alertForm.target_value}
                  onChange={(e) => setAlertForm({...alertForm, target_value: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150.00"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !alertForm.symbol.trim() || !alertForm.target_value}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
