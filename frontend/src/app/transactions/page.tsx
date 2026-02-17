"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal' | 'dividend' | 'fee' | 'trade';
  symbol: string | null;
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<Transaction['type'] | 'all'>('all');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      // Mock implementation - replace with actual API call
      // const response = await axios.get(`${API_BASE}/transactions`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // setTransactions(response.data.transactions);

      // Mock data for demonstration
      setTransactions([
        {
          id: 1,
          type: 'deposit',
          symbol: null,
          description: 'Account Deposit',
          amount: 10000.00,
          date: new Date(Date.now() - 86400000 * 7).toISOString(),
          status: 'completed'
        },
        {
          id: 2,
          type: 'trade',
          symbol: 'AAPL',
          description: 'Bought 10 AAPL @ $175.50',
          amount: -1755.00,
          date: new Date(Date.now() - 86400000 * 5).toISOString(),
          status: 'completed'
        },
        {
          id: 3,
          type: 'dividend',
          symbol: 'AAPL',
          description: 'AAPL Quarterly Dividend',
          amount: 23.40,
          date: new Date(Date.now() - 86400000 * 3).toISOString(),
          status: 'completed'
        },
        {
          id: 4,
          type: 'trade',
          symbol: 'MSFT',
          description: 'Sold 5 MSFT @ $380.00',
          amount: 1900.00,
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          status: 'completed'
        },
        {
          id: 5,
          type: 'fee',
          symbol: null,
          description: 'Trading Commission',
          amount: -9.99,
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed'
        },
        {
          id: 6,
          type: 'withdrawal',
          symbol: null,
          description: 'Bank Withdrawal',
          amount: -5000.00,
          date: new Date().toISOString(),
          status: 'pending'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const getTypeColor = (type: Transaction['type']) => {
    const colors: Record<Transaction['type'], string> = {
      deposit: 'bg-green-100 text-green-800',
      withdrawal: 'bg-red-100 text-red-800',
      dividend: 'bg-blue-100 text-blue-800',
      fee: 'bg-yellow-100 text-yellow-800',
      trade: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: Transaction['type']) => {
    const labels: Record<Transaction['type'], string> = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      dividend: 'Dividend',
      fee: 'Fee',
      trade: 'Trade'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: Transaction['status']) => {
    const colors: Record<Transaction['status'], string> = {
      completed: 'text-green-600',
      pending: 'text-yellow-600',
      failed: 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    return typeFilter === 'all' || tx.type === typeFilter;
  });

  // Calculate summary
  const totalDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalDividends = transactions.filter(t => t.type === 'dividend' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalFees = transactions.filter(t => t.type === 'fee' && t.status === 'completed').reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-gray-600">View all your account transactions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Total Deposits</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalDeposits)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Total Withdrawals</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalWithdrawals)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Dividends Received</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalDividends)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Total Fees</div>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalFees)}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                typeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {['deposit', 'withdrawal', 'dividend', 'fee', 'trade'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type as Transaction['type'])}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  typeFilter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTypeLabel(type as Transaction['type'])}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">No transactions match the selected filter</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(tx.type)}`}>
                        {getTypeLabel(tx.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.description}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount >= 0 ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium capitalize ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
