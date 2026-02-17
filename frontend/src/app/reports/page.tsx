"use client";

import React, { useState } from 'react';
import axios from 'axios';

// Types
interface ReportConfig {
  reportType: 'portfolio' | 'performance' | 'taxes' | 'transactions';
  startDate: string;
  endDate: string;
  includeDividends: boolean;
  includeFees: boolean;
  format: 'pdf' | 'csv';
}

export default function ReportsPage() {
  const [config, setConfig] = useState<ReportConfig>({
    reportType: 'portfolio',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeDividends: true,
    includeFees: true,
    format: 'pdf'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      // Mock implementation - replace with actual API call
      // const response = await axios.post(`${API_BASE}/reports/generate`, config, {
      //   headers: { Authorization: `Bearer ${token}` },
      //   responseType: 'blob'
      // });

      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock download
      const reportData = generateMockReport();
      const blob = new Blob([reportData], { type: config.format === 'pdf' ? 'application/pdf' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.reportType}_report_${config.startDate}_to_${config.endDate}.${config.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setReportGenerated(true);
      setTimeout(() => setReportGenerated(false), 3000);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockReport = () => {
    if (config.format === 'csv') {
      return `Report Type,${config.reportType}
Start Date,${config.startDate}
End Date,${config.endDate}

Portfolio Summary
Total Value,$125,750.00
Total Cost,$100,000.00
Total Gain,$25,750.00
Total Return,25.75%

Holdings
Symbol,Shares,Avg Cost,Current Price,Gain,Gain %
AAPL,50,$165.00,$178.50,$675.00,8.18%
MSFT,25,$350.00,$378.90,$722.50,8.26%
GOOGL,15,$140.00,$145.20,$78.00,3.71%
JPM,30,$180.00,$195.40,$462.00,8.56%
`;
    }
    return 'PDF Report Content (Mock)';
  };

  const reportTypes = [
    { value: 'portfolio', label: 'Portfolio Summary', description: 'Overview of all holdings and their current values' },
    { value: 'performance', label: 'Performance Analysis', description: 'Detailed performance metrics and charts' },
    { value: 'taxes', label: 'Tax Report', description: 'Realized gains/losses for tax purposes' },
    { value: 'transactions', label: 'Transaction History', description: 'All transactions within the selected period' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Reports</h1>
          <p className="text-gray-600">Create customized reports for your portfolio</p>
        </div>

        {/* Report Configuration */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>

          {/* Report Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
            <div className="space-y-2">
              {reportTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                    config.reportType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={type.value}
                    checked={config.reportType === type.value}
                    onChange={(e) => setConfig({...config, reportType: e.target.value as ReportConfig['reportType']})}
                    className="mt-1"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({...config, startDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig({...config, endDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Include</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeDividends}
                  onChange={(e) => setConfig({...config, includeDividends: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Dividend payments</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeFees}
                  onChange={(e) => setConfig({...config, includeFees: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Trading fees and commissions</span>
              </label>
            </div>
          </div>

          {/* Format */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Output Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfig({...config, format: 'pdf'})}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  config.format === 'pdf'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
              <button
                type="button"
                onClick={() => setConfig({...config, format: 'csv'})}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  config.format === 'csv'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Generate & Download Report</span>
              </>
            )}
          </button>

          {/* Success Message */}
          {reportGenerated && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 0l-2 2a1 1 0 000 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">Report downloaded successfully!</span>
            </div>
          )}
        </div>

        {/* Report Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Report Type:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">{config.reportType}</span>
              </div>
              <div>
                <span className="text-gray-500">Format:</span>
                <span className="ml-2 font-medium text-gray-900 uppercase">{config.format}</span>
              </div>
              <div>
                <span className="text-gray-500">Period:</span>
                <span className="ml-2 font-medium text-gray-900">{config.startDate} to {config.endDate}</span>
              </div>
              <div>
                <span className="text-gray-500">Dividends:</span>
                <span className="ml-2 font-medium text-gray-900">{config.includeDividends ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="text-gray-500">Fees:</span>
                <span className="ml-2 font-medium text-gray-900">{config.includeFees ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
