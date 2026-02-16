"""
Tests for trading API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models.trading import OrderType, OrderSide, OrderStatus


client = TestClient(app)


@pytest.fixture
def auth_headers(test_user):
    """Get authenticated headers for test requests."""
    token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {token}"}


def test_create_market_order(auth_headers):
    """Test creating a market order."""
    response = client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "symbol": "AAPL",
            "order_type": "market",
            "side": "buy",
            "quantity": 100
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["symbol"] == "AAPL"
    assert data["order_type"] == "market"
    assert data["side"] == "buy"
    assert data["quantity"] == 100
    assert data["status"] in ["filled", "pending"]  # Market orders may be filled immediately


def test_create_limit_order(auth_headers):
    """Test creating a limit order."""
    response = client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "symbol": "MSFT",
            "order_type": "limit",
            "side": "buy",
            "quantity": 50,
            "limit_price": 250.00
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["symbol"] == "MSFT"
    assert data["order_type"] == "limit"
    assert data["limit_price"] == 250.00
    assert data["status"] == "pending"


def test_create_stop_order(auth_headers):
    """Test creating a stop order."""
    response = client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "symbol": "GOOGL",
            "order_type": "stop",
            "side": "sell",
            "quantity": 30,
            "stop_price": 140.00
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["symbol"] == "GOOGL"
    assert data["order_type"] == "stop"
    assert data["stop_price"] == 140.00
    assert data["status"] == "pending"


def test_create_limit_order_without_price(auth_headers):
    """Test creating a limit order without price should fail."""
    response = client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "symbol": "AAPL",
            "order_type": "limit",
            "side": "buy",
            "quantity": 100
        }
    )
    assert response.status_code == 422  # Validation error


def test_create_order_invalid_quantity(auth_headers):
    """Test creating an order with invalid quantity."""
    response = client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "symbol": "AAPL",
            "order_type": "market",
            "side": "buy",
            "quantity": -1
        }
    )
    assert response.status_code == 422  # Validation error


def test_get_orders(auth_headers):
    """Test retrieving user's orders."""
    # Create an order first
    client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "symbol": "AAPL",
            "order_type": "market",
            "side": "buy",
            "quantity": 10
        }
    )

    # Get orders
    response = client.get(
        "/api/v1/orders",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "orders" in data
    assert len(data["orders"]) >= 1


def test_get_orders_with_status_filter(auth_headers):
    """Test retrieving orders with status filter."""
    response = client.get(
        "/api/v1/orders?status_filter=pending",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    for order in data["orders"]:
        assert order["status"] == "pending"


def test_get_order_detail(auth_headers):
    """Test retrieving order details."""
    # Create an order
    create_response = client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "symbol": "AAPL",
            "order_type": "limit",
            "side": "buy",
            "quantity": 50,
            "limit_price": 150.00
        }
    )
    order_id = create_response.json()["id"]

    # Get order details
    response = client.get(
        f"/api/v1/orders/{order_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == order_id
    assert "executions" in data


def test_get_nonexistent_order(auth_headers):
    """Test retrieving a non-existent order."""
    response = client.get(
        "/api/v1/orders/99999",
        headers=auth_headers
    )
    assert response.status_code == 404


def test_cancel_pending_order(auth_headers):
    """Test cancelling a pending order."""
    # Create a pending order
    create_response = client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "symbol": "AAPL",
            "order_type": "limit",
            "side": "buy",
            "quantity": 100,
            "limit_price": 200.00
        }
    )
    order_id = create_response.json()["id"]

    # Cancel the order
    response = client.delete(
        f"/api/v1/orders/{order_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "cancelled"


def test_cancel_filled_order(auth_headers):
    """Test cancelling a filled order should fail."""
    # Create a market order that will be filled
    create_response = client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "symbol": "AAPL",
            "order_type": "market",
            "side": "buy",
            "quantity": 10
        }
    )
    order_id = create_response.json()["id"]

    # Try to cancel
    response = client.delete(
        f"/api/v1/orders/{order_id}",
        headers=auth_headers
    )
    assert response.status_code == 400  # Cannot cancel filled order


def test_modify_pending_order(auth_headers):
    """Test modifying a pending order."""
    # Create a pending order
    create_response = client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "symbol": "AAPL",
            "order_type": "limit",
            "side": "buy",
            "quantity": 100,
            "limit_price": 150.00
        }
    )
    order_id = create_response.json()["id"]

    # Modify the order
    response = client.put(
        f"/api/v1/orders/{order_id}",
        headers=auth_headers,
        json={
            "quantity": 150,
            "limit_price": 155.00
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 150
    assert data["limit_price"] == 155.00


def test_validate_order(auth_headers):
    """Test order validation endpoint."""
    response = client.post(
        "/api/v1/orders/validate",
        headers=auth_headers,
        json={
            "symbol": "AAPL",
            "order_type": "market",
            "side": "buy",
            "quantity": 100
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "valid" in data
    assert "errors" in data
    assert "warnings" in data


def test_validate_invalid_order(auth_headers):
    """Test validating an invalid order."""
    response = client.post(
        "/api/v1/orders/validate",
        headers=auth_headers,
        json={
            "symbol": "AAPL",
            "order_type": "limit",
            "side": "buy",
            "quantity": 100
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0


def test_get_pending_orders(auth_headers):
    """Test retrieving pending orders."""
    # Create a pending order
    client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "symbol": "AAPL",
            "order_type": "limit",
            "side": "buy",
            "quantity": 100,
            "limit_price": 200.00
        }
    )

    # Get pending orders
    response = client.get(
        "/api/v1/orders/pending",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for order in data:
        assert order["status"] == "pending"


def test_unauthorized_order_access(test_user):
    """Test accessing orders without authentication."""
    response = client.get("/api/v1/orders")
    assert response.status_code == 401


def test_create_order_without_auth():
    """Test creating an order without authentication."""
    response = client.post(
        "/api/v1/orders",
        json={
            "symbol": "AAPL",
            "order_type": "market",
            "side": "buy",
            "quantity": 100
        }
    )
    assert response.status_code == 401
