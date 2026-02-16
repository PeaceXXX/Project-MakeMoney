"""
Market data service for fetching and managing market information.
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.market_data import Stock, MarketData, Watchlist, MarketIndex
from app.schemas.market_data import StockCreate, WatchlistCreate
from datetime import datetime, timedelta


class MarketService:
    """Service for market data operations."""

    @staticmethod
    def get_stock_by_symbol(db: Session, symbol: str) -> Optional[Stock]:
        """Get a stock by its symbol."""
        return db.query(Stock).filter(Stock.symbol == symbol.upper()).first()

    @staticmethod
    def get_or_create_stock(db: Session, symbol: str) -> Stock:
        """Get existing stock or create new one."""
        stock = MarketService.get_stock_by_symbol(db, symbol)
        if stock is None:
            stock = Stock(
                symbol=symbol.upper(),
                name=symbol.upper(),
                created_at=datetime.utcnow()
            )
            db.add(stock)
            db.commit()
            db.refresh(stock)
        return stock

    @staticmethod
    def update_market_data(db: Session, stock_id: int, price: float) -> MarketData:
        """Create or update market data for a stock."""
        stock = db.query(Stock).filter(Stock.id == stock_id).first()
        if stock is None:
            raise ValueError("Stock not found")

        # Create new market data entry
        market_data = MarketData(
            stock_id=stock_id,
            price=price,
            change=price - stock.market_data[0].price if stock.market_data else 0,
            change_percent=((price - stock.market_data[0].price) / stock.market_data[0].price) * 100 if stock.market_data[0].price > 0 else 0,
            volume=0,  # Would be from real data
            timestamp=datetime.utcnow()
        )
        db.add(market_data)
        db.commit()
        db.refresh(market_data)

        # Update stock with latest data
        # In production, would fetch from real market data API
        latest_data = db.query(MarketData).filter(
            MarketData.stock_id == stock_id
        ).order_by(MarketData.timestamp.desc()).first()

        if latest_data:
            # Get latest price
            stock.price = latest_data.price
            stock.change = stock.price - latest_data.price if latest_data.price else 0
            stock.updated_at = latest_data.timestamp
        else:
            stock.price = price
            stock.change = 0
            stock.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(stock)

        return market_data

    @staticmethod
    def add_to_watchlist(db: Session, user_id: int, stock_id: int) -> Watchlist:
        """Add a stock to user's watchlist."""
        from app.models.market_data import Watchlist as WatchlistModel

        # Check if already in watchlist
        existing = db.query(WatchlistModel).filter(
            WatchlistModel.user_id == user_id,
            WatchlistModel.stock_id == stock_id
        ).first()

        if existing:
            raise ValueError("Stock already in watchlist")

        # Get stock
        stock = db.query(Stock).filter(Stock.id == stock_id).first()
        if not stock:
            raise ValueError("Stock not found")

        # Create watchlist entry
        watchlist_entry = WatchlistModel(
            user_id=user_id,
            stock_id=stock_id,
            created_at=datetime.utcnow()
        )
        db.add(watchlist_entry)
        db.commit()
        db.refresh(watchlist_entry)
        return watchlist_entry

    @staticmethod
    def remove_from_watchlist(db: Session, user_id: int, stock_id: int) -> None:
        """Remove a stock from user's watchlist."""
        from app.models.market_data import Watchlist as WatchlistModel

        # Get watchlist entry
        watchlist_entry = db.query(WatchlistModel).filter(
            WatchlistModel.user_id == user_id,
            WatchlistModel.stock_id == stock_id
        ).first()

        if not watchlist_entry:
            raise ValueError("Stock not in watchlist")

        db.delete(watchlist_entry)
        db.commit()

    @staticmethod
    def get_watchlist(db: Session, user_id: int) -> List[Stock]:
        """Get user's watchlist with market data."""
        from app.models.market_data import Watchlist as WatchlistModel
        from sqlalchemy.orm import joinedload

        watchlist_entries = db.query(WatchlistModel).filter(
            WatchlistModel.user_id == user_id
        ).options(joinedload(Stock)).all()

        # Get stock data for each stock
        result = []
        for entry in watchlist_entries:
            # In production, would sort by timestamp
            stock_dict = {
                "id": entry.stock.id,
                "symbol": entry.stock.symbol,
                "name": entry.stock.name,
                "price": entry.stock.market_data[0].price if entry.stock.market_data else 0,
                "change": entry.stock.market_data[0].change if entry.stock.market_data else 0,
                "change_percent": entry.stock.market_data[0].change_percent if entry.stock.market_data else 0
            }
            result.append(stock_dict)

        return result

    @staticmethod
    def get_market_indices(db: Session) -> List[MarketIndex]:
        """Get major market indices (S&P 500, NASDAQ, DOW)."""
        from app.models.market_data import MarketIndex

        # In production, would fetch from real market data API
        # For now, return mock data
        now = datetime.utcnow()

        indices = [
            {
                "id": 1,
                "symbol": "SPX",
                "name": "S&P 500",
                "current_value": 5234.56,
                "change": 12.34,
                "change_percent": 0.24,
                "timestamp": now
            },
            {
                "id": 2,
                "symbol": "NASDAQ",
                "name": "NASDAQ",
                "current_value": 14963.38,
                "change": -123.45,
                "change_percent": -0.82,
                "timestamp": now
            },
            {
                "id": 3,
                "symbol": "DJI",
                "name": "Dow Jones Industrial",
                "current_value": 38512.41,
                "change": 145.67,
                "change_percent": 0.38,
                "timestamp": now
            }
        ]

        return indices


market_service = MarketService()
