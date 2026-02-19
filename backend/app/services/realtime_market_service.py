"""
Real-time market data service using Yahoo Finance API.
Provides live stock quotes during market hours and last close data after hours.
"""
from datetime import datetime, time
from typing import Optional, Dict, Any, List
import yfinance as yf
import pytz


def is_market_open() -> bool:
    """
    Check if the US stock market is currently open.

    Market hours: Monday-Friday, 9:30 AM - 4:00 PM Eastern Time
    Note: This is a simplified check and doesn't account for holidays.
    """
    # Get current time in US Eastern timezone
    eastern = pytz.timezone('US/Eastern')
    now_et = datetime.now(eastern)

    # Check if it's a weekday (Monday=0, Friday=4)
    if now_et.weekday() >= 5:
        return False

    # Market hours: 9:30 AM - 4:00 PM ET
    market_open = time(9, 30)
    market_close = time(16, 0)
    current_time = now_et.time()

    return market_open <= current_time <= market_close


def get_realtime_quote(symbol: str) -> Optional[Dict[str, Any]]:
    """
    Get real-time quote for a stock symbol.

    Returns current price, change, volume, and other market data.
    During market hours, returns live data.
    After hours, returns the last market close data.
    """
    try:
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info

        if not info:
            return None

        # Get current/market price
        current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
        previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose')

        if current_price is None:
            return None

        # Calculate change
        change = 0.0
        change_percent = 0.0
        if previous_close and previous_close > 0:
            change = current_price - previous_close
            change_percent = (change / previous_close) * 100

        return {
            'symbol': symbol.upper(),
            'name': info.get('longName') or info.get('shortName') or symbol.upper(),
            'current_price': round(current_price, 2),
            'previous_close': round(previous_close, 2) if previous_close else None,
            'change': round(change, 2),
            'change_percent': round(change_percent, 2),
            'open': info.get('regularMarketOpen'),
            'high': info.get('dayHigh') or info.get('regularMarketDayHigh'),
            'low': info.get('dayLow') or info.get('regularMarketDayLow'),
            'volume': info.get('volume') or info.get('regularMarketVolume'),
            'avg_volume': info.get('averageVolume'),
            'market_cap': info.get('marketCap'),
            'pe_ratio': info.get('trailingPE'),
            'dividend_yield': info.get('dividendYield'),
            'fifty_two_week_high': info.get('fiftyTwoWeekHigh'),
            'fifty_two_week_low': info.get('fiftyTwoWeekLow'),
            'is_market_open': is_market_open(),
            'last_updated': datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"Error fetching quote for {symbol}: {e}")
        return None


def get_multiple_quotes(symbols: List[str]) -> Dict[str, Dict[str, Any]]:
    """
    Get real-time quotes for multiple stock symbols.
    """
    results = {}
    for symbol in symbols:
        quote = get_realtime_quote(symbol)
        if quote:
            results[symbol.upper()] = quote
    return results


def get_market_indices_realtime() -> Dict[str, Dict[str, Any]]:
    """
    Get real-time data for major market indices.
    """
    indices = {
        '^GSPC': {'name': 'S&P 500', 'symbol': 'SPX'},
        '^NDX': {'name': 'NASDAQ 100', 'symbol': 'NDX'},
        '^DJI': {'name': 'DOW JONES', 'symbol': 'DJI'}
    }

    results = []
    for ticker_symbol, info in indices.items():
        quote = get_realtime_quote(ticker_symbol)
        if quote:
            results.append({
                'symbol': info['symbol'],
                'name': info['name'],
                'current_value': quote['current_price'],
                'change': quote['change'],
                'change_percent': quote['change_percent'],
                'is_market_open': quote['is_market_open'],
                'last_updated': quote['last_updated']
            })

    return results


def get_historical_data_yahoo(symbol: str, period: str = '1mo', interval: str = '1d') -> List[Dict[str, Any]]:
    """
    Get historical price data from Yahoo Finance.

    Period options: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    Interval options: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
    """
    try:
        ticker = yf.Ticker(symbol.upper())
        hist = ticker.history(period=period, interval=interval)

        if hist.empty:
            return []

        data = []
        for index, row in hist.iterrows():
            data.append({
                'timestamp': index.isoformat(),
                'open': round(row['Open'], 2),
                'high': round(row['High'], 2),
                'low': round(row['Low'], 2),
                'close': round(row['Close'], 2),
                'volume': int(row['Volume'])
            })

        return data
    except Exception as e:
        print(f"Error fetching historical data for {symbol}: {e}")
        return []


def search_stocks_yahoo(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Search for stocks using Yahoo Finance.
    """
    try:
        # Use yfinance to search for stocks
        # Note: yfinance doesn't have a direct search API, so we'll try to get info
        # for potential symbols and return valid ones
        results = []

        # Common stock suffixes to try
        potential_symbols = [
            query.upper(),
            query.upper() + '.US',
        ]

        for symbol in potential_symbols[:limit]:
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                if info and info.get('shortName'):
                    results.append({
                        'symbol': symbol.replace('.US', ''),
                        'name': info.get('shortName') or info.get('longName'),
                        'exchange': info.get('exchange', 'Unknown'),
                        'type': info.get('quoteType', 'EQUITY')
                    })
            except:
                continue

        return results
    except Exception as e:
        print(f"Error searching stocks: {e}")
        return []
