'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

interface RealtimeQuote {
  symbol: string
  name: string
  current_price: number
  previous_close: number
  change: number
  change_percent: number
  open: number
  high: number
  low: number
  volume: number
  is_market_open: boolean
  last_updated: string
}

interface MarketStatus {
  is_market_open: boolean
  message: string
}

interface UseRealtimeMarketOptions {
  symbols?: string[]
  pollInterval?: number
  enabled?: boolean
}

export function useRealtimeMarket(options: UseRealtimeMarketOptions = {}) {
  const { symbols = [], pollInterval = 10000, enabled = true } = options

  const [quotes, setQuotes] = useState<Record<string, RealtimeQuote>>({})
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'

  const fetchMarketStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const response = await axios.get(`${API_BASE}/market/realtime/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMarketStatus(response.data)
      return response.data.is_market_open
    } catch (err) {
      console.error('Failed to fetch market status:', err)
      return false
    }
  }, [API_BASE])

  const fetchQuote = useCallback(async (symbol: string) => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return null

      const response = await axios.get(`${API_BASE}/market/realtime/${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (err) {
      console.error(`Failed to fetch quote for ${symbol}:`, err)
      return null
    }
  }, [API_BASE])

  const fetchAllQuotes = useCallback(async () => {
    if (symbols.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const results = await Promise.all(symbols.map(s => fetchQuote(s)))
      const newQuotes: Record<string, RealtimeQuote> = {}

      results.forEach((quote, index) => {
        if (quote) {
          newQuotes[symbols[index].toUpperCase()] = quote
        }
      })

      setQuotes(prev => ({ ...prev, ...newQuotes }))
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      setError('Failed to fetch quotes')
    } finally {
      setLoading(false)
    }
  }, [symbols, fetchQuote])

  const refreshQuotes = useCallback(async () => {
    await fetchMarketStatus()
    await fetchAllQuotes()
  }, [fetchMarketStatus, fetchAllQuotes])

  // Initial fetch
  useEffect(() => {
    if (!enabled) return

    const init = async () => {
      const isOpen = await fetchMarketStatus()
      await fetchAllQuotes()
    }
    init()
  }, [enabled, fetchMarketStatus, fetchAllQuotes])

  // Polling during market hours
  useEffect(() => {
    if (!enabled || !marketStatus?.is_market_open) return

    const interval = setInterval(() => {
      fetchAllQuotes()
    }, pollInterval)

    return () => clearInterval(interval)
  }, [enabled, marketStatus?.is_market_open, pollInterval, fetchAllQuotes])

  return {
    quotes,
    marketStatus,
    loading,
    error,
    lastUpdated,
    refreshQuotes,
    fetchQuote,
    fetchMarketStatus
  }
}

export function useRealtimeQuote(symbol: string | null, pollInterval = 10000) {
  const [quote, setQuote] = useState<RealtimeQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'

  const fetchQuote = useCallback(async () => {
    if (!symbol) return

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const response = await axios.get(`${API_BASE}/market/realtime/${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setQuote(response.data)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      setError('Failed to fetch quote')
    } finally {
      setLoading(false)
    }
  }, [symbol, API_BASE])

  useEffect(() => {
    if (!symbol) return
    fetchQuote()
  }, [symbol, fetchQuote])

  // Poll every interval if market is open
  useEffect(() => {
    if (!symbol || !quote?.is_market_open) return

    const interval = setInterval(fetchQuote, pollInterval)
    return () => clearInterval(interval)
  }, [symbol, quote?.is_market_open, pollInterval, fetchQuote])

  return { quote, loading, error, lastUpdated, refresh: fetchQuote }
}

export type { RealtimeQuote, MarketStatus }
