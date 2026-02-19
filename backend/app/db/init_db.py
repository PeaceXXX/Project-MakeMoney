"""
Database initialization module.

Creates all database tables defined in the models.
"""
from app.core.database import Base, engine

# Import all models to register them with Base.metadata
from app.models.user import User
from app.models.portfolio import Portfolio, Holding
from app.models.trading import Order, TradeExecution
from app.models.market_data import Stock, MarketData, Watchlist, MarketIndex
from app.models.api_keys import APIKey


def init_db() -> None:
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)
