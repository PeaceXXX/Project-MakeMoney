"""
Test fixtures for the trading platform.
"""
import pytest
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.portfolio import Portfolio, Holding
from app.models.trading import Order
from app.models.market_data import Stock
from app.core.security import get_password_hash


@pytest.fixture(scope="function")
def db_session():
    """Create a database session for testing."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def test_user(db_session: Session):
    """Create a test user."""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user_2(db_session: Session):
    """Create a second test user."""
    user = User(
        email="test2@example.com",
        username="testuser2",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_portfolio(db_session: Session, test_user: User):
    """Create a test portfolio."""
    portfolio = Portfolio(
        user_id=test_user.id,
        name="Test Portfolio",
        description="A portfolio for testing"
    )
    db_session.add(portfolio)
    db_session.commit()
    db_session.refresh(portfolio)
    return portfolio


@pytest.fixture
def test_holdings(db_session: Session, test_portfolio: Portfolio):
    """Create test holdings."""
    holdings = [
        Holding(
            portfolio_id=test_portfolio.id,
            symbol="AAPL",
            quantity=100,
            purchase_price=150.00
        ),
        Holding(
            portfolio_id=test_portfolio.id,
            symbol="GOOGL",
            quantity=50,
            purchase_price=2800.00
        ),
        Holding(
            portfolio_id=test_portfolio.id,
            symbol="MSFT",
            quantity=75,
            purchase_price=300.00
        )
    ]
    for holding in holdings:
        db_session.add(holding)
    db_session.commit()
    for holding in holdings:
        db_session.refresh(holding)
    return holdings


@pytest.fixture
def test_stock(db_session: Session):
    """Create a test stock."""
    stock = Stock(
        symbol="AAPL",
        name="Apple Inc.",
        exchange="NASDAQ",
        sector="Technology",
        industry="Consumer Electronics",
        market_cap=2500000000000,
        is_active=True
    )
    db_session.add(stock)
    db_session.commit()
    db_session.refresh(stock)
    return stock


@pytest.fixture
def test_stocks(db_session: Session):
    """Create multiple test stocks."""
    stocks = [
        Stock(
            symbol="AAPL",
            name="Apple Inc.",
            exchange="NASDAQ",
            sector="Technology",
            industry="Consumer Electronics",
            market_cap=2500000000000,
            is_active=True
        ),
        Stock(
            symbol="GOOGL",
            name="Alphabet Inc.",
            exchange="NASDAQ",
            sector="Technology",
            industry="Internet Services",
            market_cap=1800000000000,
            is_active=True
        ),
        Stock(
            symbol="MSFT",
            name="Microsoft Corporation",
            exchange="NASDAQ",
            sector="Technology",
            industry="Software",
            market_cap=2200000000000,
            is_active=True
        ),
        Stock(
            symbol="JPM",
            name="JPMorgan Chase & Co.",
            exchange="NYSE",
            sector="Financial Services",
            industry="Banks",
            market_cap=450000000000,
            is_active=True
        ),
        Stock(
            symbol="XOM",
            name="Exxon Mobil Corporation",
            exchange="NYSE",
            sector="Energy",
            industry="Oil & Gas",
            market_cap=400000000000,
            is_active=True
        )
    ]
    for stock in stocks:
        db_session.add(stock)
    db_session.commit()
    for stock in stocks:
        db_session.refresh(stock)
    return stocks


@pytest.fixture
def auth_headers(test_user: User):
    """Create authentication headers for test user."""
    from app.core.security import create_access_token
    access_token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def test_order(db_session: Session, test_user: User):
    """Create a test order."""
    from app.models.trading import OrderType, OrderSide, OrderStatus
    order = Order(
        user_id=test_user.id,
        symbol="AAPL",
        order_type=OrderType.MARKET,
        side=OrderSide.BUY,
        quantity=10,
        status=OrderStatus.PENDING
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)
    return order
