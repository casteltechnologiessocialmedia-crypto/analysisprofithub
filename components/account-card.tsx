'use client';

import React, { useState } from 'react';
import { Copy, Eye, EyeOff, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface AccountData {
  userName: string;
  email: string;
  accountBalance: number;
  availableBalance: number;
  totalProfit: number;
  profitPercentage: number;
  tradingStats: {
    totalTrades: number;
    winRate: number;
    consecutiveWins: number;
    avgReturn: number;
  };
  lastUpdated: Date;
  status: 'active' | 'inactive' | 'verification_pending';
}

interface AccountCardProps {
  data?: AccountData;
  isLoading?: boolean;
  showFullBalance?: boolean;
  onRefresh?: () => void;
}

const DEFAULT_ACCOUNT_DATA: AccountData = {
  userName: 'John Trader',
  email: 'john@example.com',
  accountBalance: 25840.50,
  availableBalance: 18540.50,
  totalProfit: 5840.50,
  profitPercentage: 29.2,
  tradingStats: {
    totalTrades: 142,
    winRate: 68.3,
    consecutiveWins: 8,
    avgReturn: 2.4,
  },
  lastUpdated: new Date(),
  status: 'active',
};

export function AccountCard({ 
  data = DEFAULT_ACCOUNT_DATA, 
  isLoading = false,
  showFullBalance: initialShowBalance = true,
  onRefresh 
}: AccountCardProps) {
  const [showBalance, setShowBalance] = useState(initialShowBalance);
  const [copied, setCopied] = useState(false);

  const isProfitable = data.totalProfit >= 0;
  const isPositiveReturn = data.profitPercentage >= 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
      case 'verification_pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="soft-card p-6 space-y-4 animate-pulse">
          <div className="h-12 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="h-20 bg-muted rounded-lg"></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="soft-card p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between border-b border-white/10 pb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {data.userName}
            </h2>
            <p className="text-sm text-muted-foreground">{data.email}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(data.status)}`}>
                {data.status === 'active' ? '✓ Active' : data.status === 'verification_pending' ? '⏳ Verification' : '● Inactive'}
              </span>
              <span className="text-xs text-muted-foreground">
                Updated {new Date(data.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
              title={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                title="Refresh account data"
              >
                ↻
              </button>
            )}
          </div>
        </div>

        {/* Main Balance Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Balance */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Account Balance</p>
            <div className="flex items-baseline gap-3">
              {showBalance ? (
                <p className="text-3xl font-bold text-primary glow-soft-blue">
                  {formatCurrency(data.accountBalance)}
                </p>
              ) : (
                <p className="text-3xl font-bold text-muted">••••••••</p>
              )}
              <button
                onClick={() => copyToClipboard(data.accountBalance.toString())}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
              >
                <Copy size={16} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Available: {showBalance ? formatCurrency(data.availableBalance) : '••••••••'}
            </p>
          </div>

          {/* P&L Section */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Total P&L</p>
            <div className="flex items-baseline gap-3">
              <div className={`text-3xl font-bold flex items-center gap-2 ${isProfitable ? 'text-green-400 glow-soft-gold' : 'text-red-400'}`}>
                {isProfitable ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
                {showBalance ? formatCurrency(data.totalProfit) : '••••••••'}
              </div>
            </div>
            <p className={`text-sm font-semibold ${isPositiveReturn ? 'text-green-400' : 'text-red-400'}`}>
              {isPositiveReturn ? '+' : ''}{data.profitPercentage.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Trading Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase">Total Trades</p>
            <p className="text-xl font-bold text-foreground">{data.tradingStats.totalTrades}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase">Win Rate</p>
            <p className="text-xl font-bold text-green-400">{data.tradingStats.winRate.toFixed(1)}%</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase">Streak</p>
            <p className="text-xl font-bold text-accent">{data.tradingStats.consecutiveWins}</p>
            <p className="text-xs text-muted-foreground">consecutive wins</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase">Avg Return</p>
            <p className="text-xl font-bold text-primary">{data.tradingStats.avgReturn.toFixed(2)}%</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <button className="px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors text-sm font-medium">
            <Wallet size={16} className="inline mr-2" />
            Deposit
          </button>
          <button className="px-4 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent transition-colors text-sm font-medium">
            View All Trades
          </button>
        </div>
      </div>
    </div>
  );
}
