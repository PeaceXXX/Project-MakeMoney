"use client";

import React, { useState } from 'react';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  earnedRewards: number;
  pendingRewards: number;
}

interface ReferralHistory {
  id: string;
  email: string;
  status: 'pending' | 'completed' | 'rewarded';
  date: string;
  reward: number;
}

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);

  // Mock data - would come from API
  const stats: ReferralStats = {
    referralCode: 'TRADE2024XYZ',
    totalReferrals: 15,
    successfulReferrals: 12,
    pendingReferrals: 3,
    earnedRewards: 120.00,
    pendingRewards: 30.00
  };

  const history: ReferralHistory[] = [
    { id: '1', email: 'friend1@email.com', status: 'rewarded', date: '2026-02-15', reward: 10 },
    { id: '2', email: 'friend2@email.com', status: 'completed', date: '2026-02-14', reward: 10 },
    { id: '3', email: 'friend3@email.com', status: 'pending', date: '2026-02-12', reward: 0 },
    { id: '4', email: 'friend4@email.com', status: 'rewarded', date: '2026-02-10', reward: 10 },
    { id: '5', email: 'friend5@email.com', status: 'rewarded', date: '2026-02-08', reward: 10 },
  ];

  const referralLink = `https://trading.com/signup?ref=${stats.referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Trading Platform',
          text: 'Join me on Trading Platform and get a $10 bonus!',
          url: referralLink,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rewarded':
        return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">Rewarded</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded-full">Pending</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Referral Program</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Invite friends and earn $10 for each successful referral!
          </p>
        </div>

        {/* Referral Link Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Your Referral Link</h2>
              <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 flex items-center space-x-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="bg-transparent text-white placeholder-white/70 outline-none flex-1 text-sm"
                />
              </div>
              <p className="text-sm text-white/80 mt-2">
                Your code: <span className="font-bold">{stats.referralCode}</span>
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                {copied ? (
                  <>
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Link</span>
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center space-x-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Referrals</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalReferrals}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Successful</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.successfulReferrals}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Earned Rewards</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.earnedRewards)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Rewards</div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(stats.pendingRewards)}</div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-3">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Share Your Link</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Send your unique referral link to friends via email, social media, or messaging apps.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-3">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Friend Signs Up</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your friend creates an account and makes their first deposit of $100 or more.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-3">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Get Rewarded</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Both you and your friend receive $10 in your accounts within 24 hours!</p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Referral History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">Email</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">Reward</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <td className="py-3 text-sm text-gray-900 dark:text-white">{item.email}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="py-3">{getStatusBadge(item.status)}</td>
                    <td className="py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {item.reward > 0 ? formatCurrency(item.reward) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {history.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No referrals yet. Start sharing your link to earn rewards!
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Terms & Conditions</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>- Referred friend must make a minimum deposit of $100</li>
            <li>- Rewards are credited within 24 hours of qualifying deposit</li>
            <li>- Maximum 50 referrals per month</li>
            <li>- Self-referrals are not allowed</li>
            <li>- Program subject to change without notice</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
