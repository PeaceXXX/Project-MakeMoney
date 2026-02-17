"""
Portfolio-related schemas for API requests and responses.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


class PortfolioBase(BaseModel):
    """Base portfolio schema."""
    name: str = Field(..., min_length=1, description="Portfolio name is required")
    description: Optional[str] = None


class PortfolioCreate(PortfolioBase):
    """Schema for creating a portfolio."""
    pass


class PortfolioUpdate(BaseModel):
    """Schema for updating a portfolio."""
    name: Optional[str] = None
    description: Optional[str] = None


class PortfolioResponse(PortfolioBase):
    """Schema for portfolio response."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    holdings_count: Optional[int] = 0


class PerformanceMetrics(BaseModel):
    """Schema for portfolio performance metrics."""
    total_value: float
    total_cost: float
    profit_loss: float
    profit_loss_percent: float
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    beta: Optional[float] = None
    annualized_return: Optional[float] = None


class HoldingBase(BaseModel):
    """Base holding schema."""
    symbol: str = Field(..., min_length=1, max_length=10, description="Stock symbol")
    quantity: int = Field(..., gt=0, description="Quantity must be positive")
    purchase_price: float = Field(..., gt=0, description="Purchase price must be positive")


class HoldingCreate(HoldingBase):
    """Schema for creating a holding."""
    portfolio_id: int = Field(..., gt=0, description="Portfolio ID is required")


class HoldingResponse(HoldingBase):
    """Schema for holding response."""
    id: int
    portfolio_id: int
    symbol: str
    quantity: int
    purchase_price: float
    created_at: datetime
    updated_at: datetime
    current_price: Optional[float] = None


class Message(BaseModel):
    """Schema for generic message response."""
    message: str
