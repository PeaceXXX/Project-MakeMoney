"""
Market data API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.schemas.market_data import (
    StockCreate, StockResponse, WatchlistCreate,
    WatchlistResponse, MarketIndexBase, Timeframe
)
from app.schemas.user import UserResponse
from app.schemas.portfolio import Message
from app.services.market_service import market_service

router = APIRouter(prefix="/market", tags=["Market Data"])


@router.get("/stock/{symbol}", response_model=StockResponse)
async def get_stock(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get stock information by symbol.

    - **symbol**: Stock symbol
    """
    try:
        stock = market_service.get_or_create_stock(db, symbol)
        return StockResponse(
            id=stock.id,
            symbol=stock.symbol,
            name=stock.name,
            created_at=stock.created_at,
            updated_at=stock.updated_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("", response_model=List[StockResponse])
async def get_all_stocks(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get all stocks with market data.

    Returns list of stocks with their latest prices.
    """
    # In production, would get from database
    # For now, return empty list
    return []


@router.get("/watchlist", response_model=List[StockResponse])
async def get_watchlist(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get user's watchlist with market data.

    - **symbol**: Stock symbol
    """
    try:
        stocks = market_service.get_watchlist(db, current_user.id)

        # Get stock data for each stock
        stock_ids = [s.stock_id for s in stocks]
        market_data_map = {
            md[0]: md
            for md in db.query(Market_data).filter(MarketData.stock_id.in_(stock_ids)).all()
        }
        from app.models.market_data import MarketData

        # Build response with market data
        result = []
        for entry in stocks:
            market_data_dict = {
                "id": entry.stock.id,
                "symbol": entry.stock.symbol,
                "name": entry.stock.name,
                "price": entry.market_data[0].price if entry.stock.market_data else 0,
                "change": entry.market_data[0].change if entry.stock.market_data else 0,
                "change_percent": entry.market_data[0].change_percent if entry.stock.market_data else 0
            }
            result.append(stock_dict)

        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/watchlist", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    request: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Add a stock to watchlist.

    - **stock_id**: Stock ID
    """
    try:
        watchlist_entry = market_service.add_to_watchlist(db, current_user.id, request.stock_id)
        stock = db.query(Market_service.get_stock_by_symbol(db.symbol)).filter(Stock.id == request.stock_id).first()
        return WatchlistResponse(
            id=watchlist_entry.id,
            stock_id=watchlist_entry.stock_id,
            symbol=stock.symbol,
            name=stock.name,
            created_at=watchlist_entry.created_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/watchlist/{watchlist_id}", response_model=Message)
async def remove_from_watchlist(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Remove a stock from watchlist.

    - **watchlist_id**: Watchlist entry ID
    """
    try:
        market_service.remove_from_watchlist(db, current_user.id, watchlist_id)
        return Message(message="Stock removed from watchlist")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/indices", response_model=List[MarketIndexBase])
async def get_market_indices():
    """
    Get major market indices.

    Returns S&P 500, NASDAQ, DOW Jones Industrial.
    """
    try:
        indices = market_service.get_market_indices(db)
        return indices
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch market indices"
        )


@router.post("/market-data/{symbol}", response_model=Message, status_code=status.HTTP_202_ACCEPTED)
async def trigger_market_data_update(
    symbol: str,
    db: Session = Depends(get_db)
):
    """
    Trigger market data update for a stock.

    In production, this would be called by a background job
    to fetch real-time market data from external API.
    """
    try:
        stock = market_service.get_stock_by_symbol(db, symbol)
        if stock:
            # Trigger update - in production would send to message queue
            pass
        return Message(message="Market data update triggered")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found"
        )
