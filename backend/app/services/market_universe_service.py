from typing import List, Optional, Dict, Any
import logging
from datetime import datetime, timedelta
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
import time
import yfinance as yf
from ..core.database import SessionLocal
from ..models import Stock, MarketData

logger = logging.getLogger(__name__)

class MarketUniverseService:
    """Service to manage comprehensive stock universe and real-time data"""

    # Major US stock indices components
    SP500_SYMBOLS = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'JNJ', 'V',
        'PG', 'UNH', 'HD', 'MA', 'PYPL', 'DIS', 'NFLX', 'ADBE', 'CRM', 'NVDA',
        'INTC', 'CSCO', 'ACN', 'AMD', 'NFLX', 'CRM', 'INTU', 'TXN', 'AVGO', 'QCOM',
        'NFLX', 'CRM', 'INTU', 'TXN', 'AVGO', 'QCOM', 'NFLX', 'CRM', 'INTU', 'TXN',
        # Add more S&P 500 symbols as needed
    ]

    NASDAQ_SYMBOLS = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD', 'INTC', 'CSCO',
        'NFLX', 'ADBE', 'CRM', 'INTU', 'TXN', 'AVGO', 'QCOM', 'MU', 'LRCX', 'AMAT',
        'ASML', 'BKNG', 'CHTR', 'CMCSA', 'COST', 'CPB', 'CTAS', 'CTSH', 'CTXS', 'DOV',
        # Add more NASDAQ symbols as needed
    ]

    DOW_SYMBOLS = [
        'AAPL', 'MSFT', 'JPM', 'V', 'WMT', 'HD', 'UNH', 'PG', 'MRK', 'DIS',
        'BA', 'CSCO', 'JNJ', 'KO', 'NKE', 'MCD', 'AXP', 'TRV', 'VZ', 'IBM',
        # Add more DOW symbols as needed
    ]

    # Popular ETFs
    ETF_SYMBOLS = [
        'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'GLD', 'SLV', 'TLT', 'HYG',
        'XLF', 'XLE', 'XLK', 'XLRE', 'XLI', 'XLP', 'XLU', 'XLV', 'XLY', 'XLB'
    ]

    def __init__(self):
        self.cache = {}
        self.last_update = None
        self.cache_ttl = 300  # 5 minutes cache

    def initialize_stock_universe(self, db: Session) -> int:
        """Initialize database with comprehensive stock universe"""
        total_added = 0

        # Combine all symbols and remove duplicates
        all_symbols = list(set(
            self.SP500_SYMBOLS +
            self.NASDAQ_SYMBOLS +
            self.DOW_SYMBOLS +
            self.ETF_SYMBOLS
        ))

        logger.info(f"Initializing stock universe with {len(all_symbols)} symbols")

        for symbol in all_symbols:
            try:
                # Check if stock already exists
                existing_stock = db.query(Stock).filter(Stock.symbol == symbol).first()
                if existing_stock:
                    continue

                # Get stock info from Yahoo Finance
                stock_info = self._get_stock_info(symbol)
                if stock_info:
                    # Create stock record
                    stock = Stock(
                        symbol=symbol,
                        name=stock_info.get('name', ''),
                        exchange=stock_info.get('exchange', 'NASDAQ'),
                        sector=stock_info.get('sector', ''),
                        industry=stock_info.get('industry', ''),
                        market_cap=stock_info.get('market_cap', 0)
                    )
                    db.add(stock)
                    total_added += 1

                    # Commit in batches
                    if total_added % 50 == 0:
                        db.commit()
                        logger.info(f"Added {total_added} stocks so far...")

            except Exception as e:
                logger.error(f"Error adding stock {symbol}: {str(e)}")
                continue

        db.commit()
        logger.info(f"Stock universe initialization complete. Added {total_added} new stocks")
        return total_added

    def _get_stock_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get basic stock information from Yahoo Finance"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            return {
                'symbol': symbol,
                'name': info.get('longName', info.get('shortName', '')),
                'exchange': info.get('exchangeName', 'NASDAQ'),
                'sector': info.get('sector', ''),
                'industry': info.get('industry', ''),
                'market_cap': info.get('marketCap', 0)
            }
        except Exception as e:
            logger.error(f"Error getting info for {symbol}: {str(e)}")
            return None

    def get_all_stocks_realtime(self, db: Session, limit: int = 100, offset: int = 0) -> Dict[str, Any]:
        """Get real-time data for all stocks with pagination"""
        # Check cache first
        cache_key = f"all_stocks_{limit}_{offset}"
        if self._is_cache_valid():
            if cache_key in self.cache:
                return self.cache[cache_key]

        # Get stocks from database
        stocks_query = db.query(Stock).order_by(Stock.symbol)
        total_stocks = stocks_query.count()
        stocks = stocks_query.offset(offset).limit(limit).all()

        # Fetch real-time data
        symbols = [stock.symbol for stock in stocks]
        realtime_data =  self._fetch_batch_realtime_data(symbols)

        # Prepare response
        result = {
            'stocks': [],
            'pagination': {
                'total': total_stocks,
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < total_stocks
            },
            'timestamp': datetime.utcnow().isoformat()
        }

        for stock in stocks:
            data = realtime_data.get(stock.symbol, {})
            stock_info = {
                'symbol': stock.symbol,
                'name': stock.name,
                'price': data.get('price', 0),
                'change': data.get('change', 0),
                'change_percent': data.get('change_percent', 0),
                'volume': data.get('volume', 0),
                'market_cap': stock.market_cap or 0,
                'exchange': stock.exchange,
                'sector': stock.sector,
                'industry': stock.industry
            }
            result['stocks'].append(stock_info)

        # Cache the result
        self.cache[cache_key] = result
        self.last_update = datetime.utcnow()

        return result

    def get_sector_performance(self, db: Session) -> Dict[str, Any]:
        """Get sector performance data"""
        # Get all sectors from database
        sectors = db.query(Stock.sector).filter(Stock.sector != '').distinct().all()
        sector_list = [sector[0] for sector in sectors]

        # Fetch real-time data for all stocks
        all_stocks = db.query(Stock).all()
        symbols = [stock.symbol for stock in all_stocks]
        realtime_data =  self._fetch_batch_realtime_data(symbols)

        # Calculate sector performance
        sector_performance = []
        for sector in sector_list:
            sector_stocks = [s for s in all_stocks if s.sector == sector]
            sector_symbols = [s.symbol for s in sector_stocks]

            total_market_cap = 0
            weighted_change = 0
            total_volume = 0

            for symbol in sector_symbols:
                data = realtime_data.get(symbol, {})
                market_cap = data.get('market_cap', 0)
                change = data.get('change_percent', 0)
                volume = data.get('volume', 0)

                if market_cap > 0:
                    weighted_change += (change * market_cap)
                    total_market_cap += market_cap

                total_volume += volume

            avg_change = weighted_change / total_market_cap if total_market_cap > 0 else 0

            sector_performance.append({
                'sector': sector,
                'avg_change': round(avg_change, 2),
                'total_volume': total_volume,
                'market_cap': total_market_cap,
                'stock_count': len(sector_stocks)
            })

        # Sort by performance
        sector_performance.sort(key=lambda x: x['avg_change'], reverse=True)

        return {
            'sectors': sector_performance,
            'timestamp': datetime.utcnow().isoformat()
        }

    def get_market_breadth(self, db: Session) -> Dict[str, Any]:
        """Calculate market breadth indicators"""
        # Get all stocks with real-time data
        all_stocks = db.query(Stock).all()
        symbols = [stock.symbol for stock in all_stocks]
        realtime_data =  self._fetch_batch_realtime_data(symbols)

        # Calculate breadth indicators
        new_highs = 0
        new_lows = 0
        advancers = 0
        decliners = 0
        unchanged = 0

        for symbol, data in realtime_data.items():
            change_percent = data.get('change_percent', 0)

            if change_percent > 0:
                advancers += 1
            elif change_percent < 0:
                decliners += 1
            else:
                unchanged += 1

            # For new highs/lows, we'd need to check 52-week data
            # For now, use price change as proxy
            if change_percent > 5:  # Significant gain
                new_highs += 1
            elif change_percent < -5:  # Significant loss
                new_lows += 1

        total = len(realtime_data)

        return {
            'new_highs': new_highs,
            'new_lows': new_lows,
            'advancers': advancers,
            'decliners': decliners,
            'unchanged': unchanged,
            'total': total,
            'advance_decline_ratio': advancers / decliners if decliners > 0 else 0,
            'timestamp': datetime.utcnow().isoformat()
        }

    def get_market_overview(self, db: Session) -> Dict[str, Any]:
        """Get market overview statistics"""
        # Get major indices
        indices = ['^GSPC', '^IXIC', '^DJI']  # S&P 500, NASDAQ, DOW

        # Market status
        market_status = self._get_market_status()

        # Get top gainers/losers
        top_data =  self._get_top_gainers_losers(db)

        # Get sector summary
        sector_data =  self.get_sector_performance(db)

        return {
            'market_status': market_status,
            'indices':  self._fetch_batch_realtime_data(indices),
            'top_gainers': top_data['gainers'][:10],
            'top_losers': top_data['losers'][:10],
            'sectors': sector_data['sectors'][:5],  # Top 5 sectors
            'timestamp': datetime.utcnow().isoformat()
        }

    def _fetch_batch_realtime_data(self, symbols: List[str]) -> Dict[str, Any]:
        """Fetch real-time data for multiple symbols in batches"""
        results = {}

        # Yahoo Finance has rate limits, so fetch in batches
        batch_size = 100
        for i in range(0, len(symbols), batch_size):
            batch = symbols[i:i + batch_size]
            try:
                tickers = yf.Tickers(' '.join(batch))

                for symbol in batch:
                    try:
                        ticker = tickers.tickers.get(symbol)
                        if ticker:
                            hist = ticker.history(period='1d', interval='1m')

                            if not hist.empty:
                                latest = hist.iloc[-1]
                                prev_close = hist.iloc[-2]['Close'] if len(hist) > 1 else latest['Close']

                                price = latest['Close']
                                change = price - prev_close
                                change_percent = (change / prev_close) * 100 if prev_close > 0 else 0

                                results[symbol] = {
                                    'price': round(price, 2),
                                    'change': round(change, 2),
                                    'change_percent': round(change_percent, 2),
                                    'volume': int(latest['Volume']),
                                    'market_cap': 0  # Would need to fetch separately
                                }
                    except Exception as e:
                        logger.error(f"Error fetching data for {symbol}: {str(e)}")
                        continue

                # Small delay between batches to avoid rate limiting
                time.sleep(0.5)

            except Exception as e:
                logger.error(f"Error fetching batch {i}: {str(e)}")
                continue

        return results

    def _get_market_status(self) -> str:
        """Determine current market status"""
        now = datetime.utcnow()
        eastern_time = now.astimezone().replace(hour=now.hour-4)  # Rough EST conversion

        day = eastern_time.weekday()
        hour = eastern_time.hour
        minute = eastern_time.minute

        if day >= 5:  # Weekend
            return 'closed'
        elif day == 0 and hour < 9:  # Monday before 9:30 AM
            return 'pre-market'
        elif (day == 0 and hour == 9 and minute < 30) or (day > 0 and hour < 9):
            return 'pre-market'
        elif (day == 0 and hour == 16 and minute >= 30) or (day > 0 and hour >= 16):
            return 'after-hours'
        else:
            return 'open'

    def _get_top_gainers_losers(self, db: Session, limit: int = 50) -> Dict[str, Any]:
        """Get top gainers and losers"""
        stocks = db.query(Stock).limit(limit * 2).all()
        symbols = [stock.symbol for stock in stocks]

        realtime_data =  self._fetch_batch_realtime_data(symbols)

        gainers = []
        losers = []

        for symbol, data in realtime_data.items():
            if data.get('change_percent', 0) != 0:
                item = {
                    'symbol': symbol,
                    'name': next((s.name for s in stocks if s.symbol == symbol), ''),
                    'change_percent': data.get('change_percent', 0),
                    'price': data.get('price', 0),
                    'volume': data.get('volume', 0)
                }

                if data.get('change_percent', 0) > 0:
                    gainers.append(item)
                else:
                    losers.append(item)

        gainers.sort(key=lambda x: x['change_percent'], reverse=True)
        losers.sort(key=lambda x: x['change_percent'])

        return {
            'gainers': gainers,
            'losers': losers
        }

    def _is_cache_valid(self) -> bool:
        """Check if cache is still valid"""
        if self.last_update is None:
            return False

        return (datetime.utcnow() - self.last_update).seconds < self.cache_ttl

    def clear_cache(self):
        """Clear the cache"""
        self.cache.clear()
        self.last_update = None

# Global service instance
market_universe_service = MarketUniverseService()