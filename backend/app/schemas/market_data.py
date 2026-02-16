"""
Market data schemas for stocks and market information.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class Timeframe(str, Enum):
    """Timeframe for historical data."""
    DAY = "1D"
    WEEK = "1W"
    MONTH = "1M"
    THREE_MONTH = "3M"
    SIX_MONTH = "6M"
    YEAR = "1Y"
    ALL = "ALL"


class StockBase(BaseModel):
    """Base stock schema."""
    symbol: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., max_length=255)
    exchange: str = Field(..., max_length=50)


class StockCreate(StockBase):
    """Schema for creating a new stock."""
    sector: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    market_cap: Optional[float] = None


class StockUpdate(BaseModel):
    """Schema for updating a stock."""
    name: Optional[str] = Field(None, max_length=255)
    exchange: Optional[str] = Field(None, max_length=50)
    sector: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    market_cap: Optional[float] = None


class StockResponse(StockBase):
    """Schema for stock response."""
    id: int
    sector: Optional[str]
    industry: Optional[str]
    market_cap: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MarketDataBase(BaseModel):
    """Base market data schema."""
    timestamp: datetime
    open_price: Optional[float]
    high_price: Optional[float]
    low_price: Optional[float]
    close_price: float
    volume: int


class MarketDataCreate(MarketDataBase):
    """Schema for creating market data."""
    stock_id: int


class MarketDataResponse(MarketDataBase):
    """Schema for market data response."""
    id: int
    stock_id: int

    class Config:
        from_attributes = True


class StockWithMarketData(StockResponse):
    """Schema for stock with current market data."""
    current_price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[int] = None
    high: Optional[float] = None
    low: Optional[float] = None


class WatchlistBase(BaseModel):
    """Base watchlist schema."""
    stock_id: int


class WatchlistCreate(WatchlistBase):
    """Schema for adding to watchlist."""
    notes: Optional[str] = Field(None, max_length=500)


class WatchlistResponse(WatchlistBase):
    """Schema for watchlist response."""
    id: int
    user_id: int
    stock: StockWithMarketData
    added_at: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True


class MarketIndexBase(BaseModel):
    """Base market index schema."""
    symbol: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., max_length=100)
    current_value: float
    change: float
    change_percent: float


class MarketIndexCreate(MarketIndexBase):
    """Schema for creating a market index."""
    pass


class MarketIndexUpdate(BaseModel):
    """Schema for updating a market index."""
    current_value: float
    change: float
    change_percent: float


class MarketIndexResponse(MarketIndexBase):
    """Schema for market index response."""
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class HistoricalDataResponse(BaseModel):
    """Schema for historical price data response."""
    symbol: str
    timeframe: Timeframe
    data: List[MarketDataResponse]


class StockSearchResponse(BaseModel):
    """Schema for stock search results."""
    results: List[StockResponse]
    total: int


class MarketSnapshot(BaseModel):
    """Schema for market snapshot overview."""
    indices: List[MarketIndexResponse]
    top_gainers: List[StockWithMarketData]
    top_losers: List[StockWithMarketData]
    most_active: List[StockWithMarketData]
