/**
 * Common TypeScript types for the Trading Platform
 */

export interface User {
  id: number
  email: string
  full_name?: string
  is_active: boolean
  is_superuser: boolean
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface Portfolio {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Holding {
  id: number
  symbol: string
  quantity: number
  purchase_price: number
  current_price?: number
  portfolio_id: number
}

export interface Order {
  id: number
  symbol: string
  order_type: 'market' | 'limit' | 'stop-loss'
  side: 'buy' | 'sell'
  quantity: number
  price?: number
  status: 'pending' | 'filled' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface MarketData {
  symbol: string
  price: number
  change: number
  change_percent: number
  volume: number
  timestamp: string
}
