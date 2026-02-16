"""
Trading schemas for order management.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from app.models.trading import OrderType, OrderSide, OrderStatus


class OrderBase(BaseModel):
    """Base order schema."""
    symbol: str = Field(..., min_length=1, max_length=20, description="Stock symbol")
    order_type: OrderType = Field(..., description="Type of order (market, limit, stop)")
    side: OrderSide = Field(..., description="Buy or sell")
    quantity: int = Field(..., gt=0, description="Number of shares")

    @validator('symbol')
    def symbol_uppercase(cls, v):
        return v.upper()


class OrderCreate(OrderBase):
    """Schema for creating a new order."""
    limit_price: Optional[float] = Field(None, gt=0, description="Limit price for limit orders")
    stop_price: Optional[float] = Field(None, gt=0, description="Stop price for stop orders")
    notes: Optional[str] = None

    @validator('limit_price')
    def validate_limit_price(cls, v, values):
        if 'order_type' in values and values['order_type'] == OrderType.LIMIT and v is None:
            raise ValueError('limit_price is required for limit orders')
        return v

    @validator('stop_price')
    def validate_stop_price(cls, v, values):
        if 'order_type' in values:
            order_type = values['order_type']
            if order_type in [OrderType.STOP, OrderType.STOP_LIMIT] and v is None:
                raise ValueError('stop_price is required for stop orders')
            if order_type == OrderType.STOP_LIMIT and 'limit_price' not in values:
                raise ValueError('limit_price is required for stop-limit orders')
        return v


class OrderUpdate(BaseModel):
    """Schema for updating an order."""
    quantity: Optional[int] = Field(None, gt=0)
    limit_price: Optional[float] = Field(None, gt=0)
    stop_price: Optional[float] = Field(None, gt=0)
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    """Schema for order response."""
    id: int
    user_id: int
    symbol: str
    order_type: OrderType
    side: OrderSide
    quantity: int
    filled_quantity: int
    limit_price: Optional[float]
    stop_price: Optional[float]
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    filled_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    rejection_reason: Optional[str]
    notes: Optional[str]

    class Config:
        from_attributes = True


class OrderDetail(OrderResponse):
    """Schema for detailed order response including executions."""
    executions: List['TradeExecutionResponse'] = []


class TradeExecutionBase(BaseModel):
    """Base trade execution schema."""
    symbol: str
    side: OrderSide
    quantity: int
    price: float = Field(..., gt=0)


class TradeExecutionResponse(TradeExecutionBase):
    """Schema for trade execution response."""
    id: int
    order_id: int
    commission: float
    executed_at: datetime
    execution_id: Optional[str]

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    """Schema for paginated order list response."""
    orders: List[OrderResponse]
    total: int
    page: int
    page_size: int


class OrderConfirmation(BaseModel):
    """Schema for order confirmation dialog."""
    order_type: OrderType
    side: OrderSide
    symbol: str
    quantity: int
    estimated_price: Optional[float] = None
    total_value: float
    commission: float = 0.0
    net_value: float


class OrderValidationResult(BaseModel):
    """Schema for order validation result."""
    valid: bool
    errors: List[str] = []
    warnings: List[str] = []
