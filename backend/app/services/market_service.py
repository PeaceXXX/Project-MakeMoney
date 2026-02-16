"""
Market data service for stocks, watchlists, and market indices.
"""
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.market_data import Stock, MarketData, Watchlist, MarketIndex
from app.models.user import User
from app.schemas.market_data import (
    StockCreate,
    StockUpdate,
    WatchlistCreate,
    MarketIndexCreate,
    MarketIndexUpdate,
    StockWithMarketData,
    WatchlistResponse,
    MarketIndexResponse,
    Timeframe
)


def get_or_create_stock(db: Session, symbol: str, name: str = None, exchange: str = "NASDAQ") -> Stock:
    """
    Get an existing stock or create a new one.

    Args:
        db: Database session
        symbol: Stock symbol (uppercase)
        name: Company name (optional if creating new stock)
        exchange: Exchange name (default NASDAQ)

    Returns:
        Stock object
    """
    symbol = symbol.upper()
    stock = db.query(Stock).filter(Stock.symbol == symbol).first()

    if not stock:
        if not name:
            raise ValueError("Stock name is required when creating a new stock")
        stock = Stock(symbol=symbol, name=name, exchange=exchange)
        db.add(stock)
        db.commit()
        db.refresh(stock)

    return stock


def create_stock(db: Session, stock_data: StockCreate) -> Stock:
    """
    Create a new stock.

    Args:
        db: Database session
        stock_data: Stock creation data

    Returns:
        Created Stock object
    """
    db_stock = Stock(
        symbol=stock_data.symbol.upper(),
        name=stock_data.name,
        exchange=stock_data.exchange,
        sector=stock_data.sector,
        industry=stock_data.industry,
        market_cap=stock_data.market_cap
    )
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock


def get_stock(db: Session, stock_id: int) -> Optional[Stock]:
    """
    Get a stock by ID.

    Args:
        db: Database session
        stock_id: Stock ID

    Returns:
        Stock object or None
    """
    return db.query(Stock).filter(Stock.id == stock_id).first()


def get_stock_by_symbol(db: Session, symbol: str) -> Optional[Stock]:
    """
    Get a stock by symbol.

    Args:
        db: Database session
        symbol: Stock symbol

    Returns:
        Stock object or None
    """
    return db.query(Stock).filter(Stock.symbol == symbol.upper()).first()


def search_stocks(db: Session, query: str, limit: int = 20) -> List[Stock]:
    """
    Search for stocks by symbol or name.

    Args:
        db: Database session
        query: Search query
        limit: Maximum results

    Returns:
        List of Stock objects
    """
    query = f"%{query.upper()}%"
    return db.query(Stock).filter(
        (Stock.symbol.like(query)) | (Stock.name.like(query))
    ).limit(limit).all()


def update_market_data(db: Session, symbol: str, market_data: dict) -> MarketData:
    """
    Update or create market data for a stock.

    Args:
        db: Database session
        symbol: Stock symbol
        market_data: Dictionary with price data (open, high, low, close, volume)

    Returns:
        MarketData object
    """
    stock = get_or_create_stock(
        db,
        symbol,
        market_data.get('name', symbol),
        market_data.get('exchange', 'NASDAQ')
    )

    # Create new market data entry
    db_market_data = MarketData(
        stock_id=stock.id,
        timestamp=datetime.utcnow(),
        open_price=market_data.get('open_price'),
        high_price=market_data.get('high_price'),
        low_price=market_data.get('low_price'),
        close_price=market_data['close_price'],
        volume=market_data.get('volume', 0)
    )

    db.add(db_market_data)
    db.commit()
    db.refresh(db_market_data)
    return db_market_data


def get_historical_data(
    db: Session,
    stock_id: int,
    timeframe: Timeframe,
    limit: int = 100
) -> List[MarketData]:
    """
    Get historical market data for a stock.

    Args:
        db: Database session
        stock_id: Stock ID
        timeframe: Timeframe for data
        limit: Maximum number of records

    Returns:
        List of MarketData objects
    """
    # Calculate start date based on timeframe
    start_date = datetime.utcnow()
    if timeframe == Timeframe.DAY:
        start_date -= timedelta(days=1)
    elif timeframe == Timeframe.WEEK:
        start_date -= timedelta(weeks=1)
    elif timeframe == Timeframe.MONTH:
        start_date -= timedelta(days=30)
    elif timeframe == Timeframe.THREE_MONTH:
        start_date -= timedelta(days=90)
    elif timeframe == Timeframe.SIX_MONTH:
        start_date -= timedelta(days=180)
    elif timeframe == Timeframe.YEAR:
        start_date -= timedelta(days=365)
    else:
        start_date = None  # ALL timeframe

    query = db.query(MarketData).filter(MarketData.stock_id == stock_id)

    if start_date:
        query = query.filter(MarketData.timestamp >= start_date)

    return query.order_by(MarketData.timestamp.desc()).limit(limit).all()


def get_latest_market_data(db: Session, stock_id: int) -> Optional[MarketData]:
    """
    Get the latest market data for a stock.

    Args:
        db: Database session
        stock_id: Stock ID

    Returns:
        MarketData object or None
    """
    return db.query(MarketData).filter(
        MarketData.stock_id == stock_id
    ).order_by(MarketData.timestamp.desc()).first()


def get_stock_with_market_data(db: Session, symbol: str) -> Optional[StockWithMarketData]:
    """
    Get a stock with current market data.

    Args:
        db: Database session
        symbol: Stock symbol

    Returns:
        StockWithMarketData object or None
    """
    stock = get_stock_by_symbol(db, symbol)
    if not stock:
        return None

    latest_data = get_latest_market_data(db, stock.id)

    stock_dict = {
        **stock.__dict__,
        'current_price': latest_data.close_price if latest_data else None,
        'change': latest_data.close_price - latest_data.open_price if latest_data else None,
        'change_percent': ((latest_data.close_price - latest_data.open_price) / latest_data.open_price * 100) if latest_data and latest_data.open_price else None,
        'volume': latest_data.volume if latest_data else None,
        'high': latest_data.high_price if latest_data else None,
        'low': latest_data.low_price if latest_data else None
    }

    return StockWithMarketData(**stock_dict)


def add_to_watchlist(db: Session, user: User, stock_id: int, notes: str = None) -> Watchlist:
    """
    Add a stock to user's watchlist.

    Args:
        db: Database session
        user: User object
        stock_id: Stock ID
        notes: Optional notes

    Returns:
        Watchlist object
    """
    # Check if already in watchlist
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == user.id,
        Watchlist.stock_id == stock_id
    ).first()

    if existing:
        raise ValueError("Stock is already in watchlist")

    watchlist_item = Watchlist(
        user_id=user.id,
        stock_id=stock_id,
        notes=notes
    )
    db.add(watchlist_item)
    db.commit()
    db.refresh(watchlist_item)
    return watchlist_item


def remove_from_watchlist(db: Session, user: User, watchlist_id: int) -> bool:
    """
    Remove a stock from user's watchlist.

    Args:
        db: Database session
        user: User object
        watchlist_id: Watchlist item ID

    Returns:
        True if removed, False otherwise
    """
    item = db.query(Watchlist).filter(
        Watchlist.id == watchlist_id,
        Watchlist.user_id == user.id
    ).first()

    if not item:
        return False

    db.delete(item)
    db.commit()
    return True


def get_watchlist(db: Session, user: User) -> List[WatchlistResponse]:
    """
    Get user's watchlist with market data.

    Args:
        db: Database session
        user: User object

    Returns:
        List of WatchlistResponse objects
    """
    watchlist_items = db.query(Watchlist).filter(
        Watchlist.user_id == user.id
    ).all()

    results = []
    for item in watchlist_items:
        stock_with_data = get_stock_with_market_data(db, item.stock.symbol)
        if stock_with_data:
            result = WatchlistResponse(
                id=item.id,
                user_id=item.user_id,
                stock_id=item.stock_id,
                stock=stock_with_data,
                added_at=item.added_at,
                notes=item.notes
            )
            results.append(result)

    return results


def create_market_index(db: Session, index_data: MarketIndexCreate) -> MarketIndex:
    """
    Create a market index.

    Args:
        db: Database session
        index_data: Index creation data

    Returns:
        Created MarketIndex object
    """
    db_index = MarketIndex(
        symbol=index_data.symbol.upper(),
        name=index_data.name,
        current_value=index_data.current_value,
        change=index_data.change,
        change_percent=index_data.change_percent
    )
    db.add(db_index)
    db.commit()
    db.refresh(db_index)
    return db_index


def get_market_indices(db: Session) -> List[MarketIndexResponse]:
    """
    Get all market indices.

    Args:
        db: Database session

    Returns:
        List of MarketIndexResponse objects
    """
    indices = db.query(MarketIndex).all()
    return [MarketIndexResponse.model_validate(idx) for idx in indices]


def update_market_index(db: Session, index_id: int, index_data: MarketIndexUpdate) -> MarketIndex:
    """
    Update a market index.

    Args:
        db: Database session
        index_id: Index ID
        index_data: Index update data

    Returns:
        Updated MarketIndex object
    """
    index = db.query(MarketIndex).filter(MarketIndex.id == index_id).first()
    if not index:
        raise ValueError("Market index not found")

    index.current_value = index_data.current_value
    index.change = index_data.change
    index.change_percent = index_data.change_percent
    index.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(index)
    return index


def initialize_market_indices(db: Session):
    """
    Initialize market indices with common US indices.

    Args:
        db: Database session
    """
    indices_data = [
        {"symbol": "SPX", "name": "S&P 500", "current_value": 5000.0, "change": 50.0, "change_percent": 1.0},
        {"symbol": "NDX", "name": "NASDAQ 100", "current_value": 18000.0, "change": 100.0, "change_percent": 0.56},
        {"symbol": "DJI", "name": "DOW JONES", "current_value": 38000.0, "change": -50.0, "change_percent": -0.13}
    ]

    for idx_data in indices_data:
        existing = db.query(MarketIndex).filter(MarketIndex.symbol == idx_data["symbol"]).first()
        if not existing:
            create_market_index(db, MarketIndexCreate(**idx_data))
