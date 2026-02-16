"""
Market data models for stocks, market data, and watchlists.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.models.user import Base


class Stock(Base):
    """Stock model for company information."""
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    exchange = Column(String(50), nullable=False)
    sector = Column(String(100), nullable=True)
    industry = Column(String(100), nullable=True)
    market_cap = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    market_data = relationship("MarketData", back_populates="stock", cascade="all, delete-orphan")
    watchlist_items = relationship("Watchlist", back_populates="stock", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Stock(symbol={self.symbol}, name={self.name})>"


class MarketData(Base):
    """Market data model for stock prices."""
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    open_price = Column(Float, nullable=True)
    high_price = Column(Float, nullable=True)
    low_price = Column(Float, nullable=True)
    close_price = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)

    # Composite index for efficient queries
    __table_args__ = (
        Index('ix_market_data_stock_timestamp', 'stock_id', 'timestamp'),
    )

    # Relationships
    stock = relationship("Stock", back_populates="market_data")

    def __repr__(self):
        return f"<MarketData(stock_id={self.stock_id}, timestamp={self.timestamp}, close={self.close_price})>"


class Watchlist(Base):
    """Watchlist model for user's tracked stocks."""
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(String(500), nullable=True)

    # Relationships
    user = relationship("User", back_populates="watchlist_items")
    stock = relationship("Stock", back_populates="watchlist_items")

    def __repr__(self):
        return f"<Watchlist(user_id={self.user_id}, stock_id={self.stock_id})>"


class MarketIndex(Base):
    """Market index model for major indices like S&P 500, NASDAQ, DOW."""
    __tablename__ = "market_indices"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    current_value = Column(Float, nullable=False)
    change = Column(Float, nullable=False)
    change_percent = Column(Float, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<MarketIndex(symbol={self.symbol}, value={self.current_value})>"
