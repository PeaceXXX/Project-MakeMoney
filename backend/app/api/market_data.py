"""
Market data API endpoints for stocks and market information.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.market_data import (
    StockCreate,
    StockUpdate,
    StockResponse,
    StockWithMarketData,
    StockSearchResponse,
    MarketDataCreate,
    MarketDataResponse,
    HistoricalDataResponse,
    WatchlistCreate,
    WatchlistResponse,
    MarketIndexCreate,
    MarketIndexUpdate,
    MarketIndexResponse,
    MarketSnapshot,
    Timeframe
)
from app.services.market_service import (
    get_or_create_stock,
    create_stock,
    get_stock,
    get_stock_by_symbol,
    search_stocks,
    update_market_data,
    get_historical_data,
    get_stock_with_market_data,
    add_to_watchlist,
    remove_from_watchlist,
    get_watchlist,
    create_market_index,
    get_market_indices,
    update_market_index,
    initialize_market_indices
)


router = APIRouter()


@router.get("/market/stock/{symbol}", response_model=StockWithMarketData)
def get_stock_info(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get stock information with current market data.

    Returns stock details, current price, daily change, and volume.
    """
    stock_with_data = get_stock_with_market_data(db, symbol)
    if not stock_with_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found"
        )
    return stock_with_data


@router.get("/market/stocks/search", response_model=StockSearchResponse)
def search_stocks_endpoint(
    query: str = Query(..., min_length=1, description="Search query for symbol or name"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Search for stocks by symbol or company name.
    """
    results = search_stocks(db, query, limit)
    return StockSearchResponse(
        results=[StockResponse.model_validate(s) for s in results],
        total=len(results)
    )


@router.get("/market/stock/{symbol}/history", response_model=HistoricalDataResponse)
def get_stock_history(
    symbol: str,
    timeframe: Timeframe = Query(Timeframe.MONTH, description="Timeframe for historical data"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of data points"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get historical price data for a stock.

    Supports multiple timeframes: 1D, 1W, 1M, 3M, 6M, 1Y, ALL
    """
    stock = get_stock_by_symbol(db, symbol)
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found"
        )

    historical_data = get_historical_data(db, stock.id, timeframe, limit)
    return HistoricalDataResponse(
        symbol=symbol.upper(),
        timeframe=timeframe,
        data=[MarketDataResponse.model_validate(d) for d in historical_data]
    )


@router.get("/market/watchlist", response_model=List[WatchlistResponse])
def get_user_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the current user's watchlist with current market data.
    """
    watchlist = get_watchlist(db, current_user)
    return watchlist


@router.post("/market/watchlist", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
def add_stock_to_watchlist(
    watchlist_data: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add a stock to the user's watchlist.
    """
    # Verify stock exists
    stock = get_stock(db, watchlist_data.stock_id)
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found"
        )

    try:
        watchlist_item = add_to_watchlist(db, current_user, watchlist_data.stock_id, watchlist_data.notes)
        # Return full watchlist response with market data
        full_watchlist = get_watchlist(db, current_user)
        return [w for w in full_watchlist if w.id == watchlist_item.id][0]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/market/watchlist/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_stock_from_watchlist(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove a stock from the user's watchlist.
    """
    success = remove_from_watchlist(db, current_user, watchlist_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist item not found"
        )
    return None


@router.get("/market/indices", response_model=List[MarketIndexResponse])
def get_market_indices_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get major market indices (S&P 500, NASDAQ, DOW).
    """
    # Initialize indices if they don't exist
    initialize_market_indices(db)
    return get_market_indices(db)


@router.post("/market/indices", response_model=MarketIndexResponse, status_code=status.HTTP_201_CREATED)
def create_market_index_endpoint(
    index_data: MarketIndexCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new market index.

    Requires superuser privileges (not implemented in this example).
    """
    return create_market_index(db, index_data)


@router.put("/market/indices/{index_id}", response_model=MarketIndexResponse)
def update_market_index_endpoint(
    index_id: int,
    index_data: MarketIndexUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a market index.

    Requires superuser privileges.
    """
    try:
        return update_market_index(db, index_id, index_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/market/snapshot", response_model=MarketSnapshot)
def get_market_snapshot(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get market snapshot including indices and top movers.

    Returns major indices and top gainers/losers/most active stocks.
    """
    # Initialize indices if needed
    initialize_market_indices(db)

    indices = get_market_indices(db)

    # Get all stocks with market data
    from sqlalchemy import desc
    from app.models.market_data import MarketData

    # Get top gainers (highest positive change)
    top_gainers = db.query(MarketData).filter(
        MarketData.open_price > 0,
        MarketData.close_price > MarketData.open_price
    ).order_by(
        desc((MarketData.close_price - MarketData.open_price) / MarketData.open_price)
    ).limit(5).all()

    # Get top losers (highest negative change)
    top_losers = db.query(MarketData).filter(
        MarketData.open_price > 0,
        MarketData.close_price < MarketData.open_price
    ).order_by(
        (MarketData.close_price - MarketData.open_price) / MarketData.open_price
    ).limit(5).all()

    # Get most active (highest volume)
    most_active = db.query(MarketData).order_by(
        desc(MarketData.volume)
    ).limit(5).all()

    # Convert to StockWithMarketData
    gainers_data = [
        StockWithMarketData(**{
            **d.stock.__dict__,
            'current_price': d.close_price,
            'change': d.close_price - d.open_price,
            'change_percent': ((d.close_price - d.open_price) / d.open_price * 100) if d.open_price else 0,
            'volume': d.volume,
            'high': d.high_price,
            'low': d.low_price
        })
        for d in top_gainers
    ]

    losers_data = [
        StockWithMarketData(**{
            **d.stock.__dict__,
            'current_price': d.close_price,
            'change': d.close_price - d.open_price,
            'change_percent': ((d.close_price - d.open_price) / d.open_price * 100) if d.open_price else 0,
            'volume': d.volume,
            'high': d.high_price,
            'low': d.low_price
        })
        for d in top_losers
    ]

    active_data = [
        StockWithMarketData(**{
            **d.stock.__dict__,
            'current_price': d.close_price,
            'change': d.close_price - d.open_price,
            'change_percent': ((d.close_price - d.open_price) / d.open_price * 100) if d.open_price else 0,
            'volume': d.volume,
            'high': d.high_price,
            'low': d.low_price
        })
        for d in most_active
    ]

    return MarketSnapshot(
        indices=indices,
        top_gainers=gainers_data,
        top_losers=losers_data,
        most_active=active_data
    )


@router.post("/market-data/{symbol}", response_model=MarketDataResponse, status_code=status.HTTP_201_CREATED)
def update_market_data_endpoint(
    symbol: str,
    market_data: MarketDataCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update market data for a stock.

    This would typically be called by a scheduled job or external data feed.
    """
    try:
        # Get or create stock with provided name
        stock = get_or_create_stock(db, symbol, "Updated Name", "NASDAQ")
        market_data_dict = market_data.model_dump()
        market_data_dict['name'] = stock.name
        market_data_dict['exchange'] = stock.exchange

        result = update_market_data(db, symbol, market_data_dict)
        return MarketDataResponse.model_validate(result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
