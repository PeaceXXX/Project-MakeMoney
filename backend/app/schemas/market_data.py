"""
Market data schemas for API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class StockBase(BaseModel):
    """Base stock schema."""
    symbol: str = Field(..., min_length=1, max_length=10, description="Stock symbol")
    name: Optional[str] = None


class StockCreate(StockBase):
    """Schema for creating a stock."""
    pass


class StockResponse(StockBase):
    """Schema for stock response."""
    id: int
    symbol: str
    name: Optional[str]
    created_at: datetime
    updated_at: datetime


class MarketDataBase(BaseModel):
    """Base market data schema."""
    stock_id: int
    price: float
    change: float
    change_percent: float
    volume: int
    timestamp: datetime


class WatchlistBase(BaseModel):
    """Base watchlist schema."""
    stock_id: int = Field(..., gt=0, description="Stock ID is required")


class WatchlistCreate(WatchlistBase):
    """Schema for adding to watchlist."""
    pass


class WatchlistResponse(WatchlistBase):
    """Schema for watchlist response."""
    id: int
    stock_id: int
    symbol: str
    name: Optional[str]
    created_at: datetime


class MarketIndexBase(BaseModel):
    """Base market index schema."""
    symbol: str = Field(..., min_length=1, max_length=10)
    name: str = Field(..., min_length=1, max_length=50)
    current_value: float = Field(..., description="Current index value")
    change: float
    change_percent: float
    timestamp: datetime


class Timeframe(str):
    """Timeframe options for market data."""
    ONE_D = "1D"
    ONE_W = "1W"
    ONE_M = "1M"
    THREE_M = "3M"
    ONE_Y = "1Y"
    FIVE_Y = "5Y"
    ALL = "ALL"
