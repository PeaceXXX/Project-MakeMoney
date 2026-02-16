"""
Market data database models.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Stock(Base):
    """Stock model for market data."""
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    market_data = relationship("MarketData", back_populates="stocks")


class MarketData(Base):
    """Market data model for stock prices."""
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    price = Column(Float, nullable=False)
    change = Column(Float, nullable=False)
    change_percent = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    stock = relationship("Stock", back_populates="market_data")


class Watchlist(Base):
    """Watchlist model for user's watched stocks."""
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="watchlists")
    stock = relationship("Stock", back_populates="watchlists")


class MarketIndex(Base):
    """Market index model for market indices."""
    __tablename__ = "market_indices"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(50))
    current_value = Column(Float, nullable=False)
    change = Column(Float, nullable=False)
    change_percent = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
