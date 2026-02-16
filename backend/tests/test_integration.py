"""
Integration tests for the Trading Platform API.

Tests the full API including authentication, portfolio management,
trading, market data, and API keys.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models.user import User


@pytest.fixture
def test_user_with_balance(db_session, test_user):
    """Get a test user with account balance."""
    # In a real implementation, you would create an account with balance
    return test_user


@pytest.fixture
def auth_headers(test_user):
    """Get authenticated headers for API requests."""
    token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def api_key(test_user, db_session):
    """Create an API key for testing."""
    from app.models.api_keys import APIKey
    from app.services.api_key_service import create_api_key
    from app.schemas.api_keys import APIKeyCreate

    key_data = APIKeyCreate(
        name="Test API Key",
        scopes=["read", "write"],
        expires_in_days=30
    )
    return create_api_key(db_session, test_user, key_data)


@pytest.mark.integration
class TestPortfolioAPI:
    """Integration tests for portfolio API endpoints."""

    def test_get_portfolio_list(self, auth_headers):
        """Test retrieving portfolio list."""
        response = TestClient(app).get("/api/v1/portfolios", headers=auth_headers)
        assert response.status_code == 200
        assert "portfolios" in response.json()

    def test_create_portfolio(self, auth_headers):
        """Test creating a new portfolio."""
        response = TestClient(app).post(
            "/api/v1/portfolios",
            headers=auth_headers,
            json={
                "name": "Test Portfolio",
                "description": "Integration test portfolio"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Portfolio"
        assert "id" in data

    def test_get_portfolio_performance(self, auth_headers):
        """Test retrieving portfolio performance metrics."""
        # First create a portfolio
        create_response = TestClient(app).post(
            "/api/v1/portfolios",
            headers=auth_headers,
            json={"name": "Performance Test", "description": "Test"}
        )
        portfolio_id = create_response.json()["id"]

        # Get performance
        response = TestClient(app).get(
            f"/api/v1/portfolios/{portfolio_id}/performance",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_value" in data
        assert "total_return" in data


@pytest.mark.integration
class TestTradingAPI:
    """Integration tests for trading API endpoints."""

    def test_create_market_order(self, auth_headers):
        """Test creating a market order."""
        response = TestClient(app).post(
            "/api/v1/orders",
            headers=auth_headers,
            json={
                "symbol": "AAPL",
                "order_type": "market",
                "side": "buy",
                "quantity": 10
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["symbol"] == "AAPL"
        assert data["status"] in ["filled", "pending"]

    def test_create_limit_order(self, auth_headers):
        """Test creating a limit order."""
        response = TestClient(app).post(
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
        assert data["limit_price"] == 250.00
        assert data["status"] == "pending"

    def test_get_orders(self, auth_headers):
        """Test retrieving user's orders."""
        response = TestClient(app).get(
            "/api/v1/orders",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        assert "total" in data

    def test_cancel_pending_order(self, auth_headers):
        """Test cancelling a pending order."""
        # Create a pending order
        create_response = TestClient(app).post(
            "/api/v1/orders",
            headers=auth_headers,
            json={
                "symbol": "GOOGL",
                "order_type": "limit",
                "side": "buy",
                "quantity": 30,
                "limit_price": 200.00
            }
        )
        order_id = create_response.json()["id"]

        # Cancel the order
        response = TestClient(app).delete(
            f"/api/v1/orders/{order_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cancelled"


@pytest.mark.integration
class TestMarketDataAPI:
    """Integration tests for market data API endpoints."""

    def test_get_market_indices(self, auth_headers):
        """Test retrieving market indices."""
        response = TestClient(app).get(
            "/api/v1/market/indices",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_watchlist(self, auth_headers):
        """Test retrieving user's watchlist."""
        response = TestClient(app).get(
            "/api/v1/market/watchlist",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_search_stocks(self, auth_headers):
        """Test searching for stocks."""
        response = TestClient(app).get(
            "/api/v1/market/stocks/search?query=AAPL",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "total" in data


@pytest.mark.integration
class TestAPIKeysAPI:
    """Integration tests for API key management."""

    def test_create_api_key(self, auth_headers):
        """Test creating an API key."""
        response = TestClient(app).post(
            "/api/v1/api-keys",
            headers=auth_headers,
            json={
                "name": "Integration Test Key",
                "scopes": ["read"],
                "expires_in_days": 30
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "key" in data  # Key is only shown on creation
        assert data["name"] == "Integration Test Key"

    def test_get_api_keys(self, auth_headers):
        """Test retrieving user's API keys."""
        response = TestClient(app).get(
            "/api/v1/api-keys",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "keys" in data
        assert "total" in data
        # Key values should NOT be in the list
        for key in data["keys"]:
            assert "key" not in key

    def test_revoke_api_key(self, auth_headers):
        """Test revoking an API key."""
        # Create a key
        create_response = TestClient(app).post(
            "/api/v1/api-keys",
            headers=auth_headers,
            json={"name": "To Revoke", "scopes": ["read"]}
        )
        key_id = create_response.json()["id"]

        # Revoke the key
        response = TestClient(app).post(
            f"/api/v1/api-keys/{key_id}/revoke",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False
        assert data["revoked_at"] is not None

    def test_authenticate_with_api_key(self, api_key, db_session):
        """Test authenticating with an API key."""
        client = TestClient(app)
        response = client.get(
            "/api/v1/portfolios",
            headers={"X-API-Key": api_key.key}
        )
        # Should work with valid API key
        assert response.status_code in [200, 404]  # 200 if portfolios exist, 404 if empty

    def test_invalid_api_key(self):
        """Test that invalid API key is rejected."""
        client = TestClient(app)
        response = client.get(
            "/api/v1/portfolios",
            headers={"X-API-Key": "invalid_key_12345"}
        )
        assert response.status_code == 401


@pytest.mark.integration
class TestEndToEndFlow:
    """End-to-end integration tests for complete user workflows."""

    def test_complete_trading_workflow(self, auth_headers):
        """Test complete workflow: create portfolio, add holding, create order."""
        client = TestClient(app)

        # Step 1: Create a portfolio
        portfolio_response = client.post(
            "/api/v1/portfolios",
            headers=auth_headers,
            json={"name": "E2E Test Portfolio", "description": "End-to-end test"}
        )
        assert portfolio_response.status_code == 201
        portfolio_id = portfolio_response.json()["id"]

        # Step 2: Create a market order
        order_response = client.post(
            "/api/v1/orders",
            headers=auth_headers,
            json={
                "symbol": "AAPL",
                "order_type": "market",
                "side": "buy",
                "quantity": 10
            }
        )
        assert order_response.status_code == 201
        order_id = order_response.json()["id"]

        # Step 3: Get portfolio performance
        perf_response = client.get(
            f"/api/v1/portfolios/{portfolio_id}/performance",
            headers=auth_headers
        )
        assert perf_response.status_code == 200

        # Step 4: Get order details
        order_detail_response = client.get(
            f"/api/v1/orders/{order_id}",
            headers=auth_headers
        )
        assert order_detail_response.status_code == 200
        assert "executions" in order_detail_response.json()


@pytest.mark.integration
class TestErrorHandling:
    """Integration tests for API error handling."""

    def test_validation_error_response(self, auth_headers):
        """Test that validation errors return proper format."""
        response = TestClient(app).post(
            "/api/v1/orders",
            headers=auth_headers,
            json={
                "symbol": "",
                "order_type": "market",
                "side": "buy",
                "quantity": -1
            }
        )
        assert response.status_code == 422
        assert "detail" in response.json()

    def test_not_found_response(self, auth_headers):
        """Test that 404 errors return proper format."""
        response = TestClient(app).get(
            "/api/v1/portfolios/99999",
            headers=auth_headers
        )
        assert response.status_code == 404
        assert "detail" in response.json()

    def test_unauthorized_response(self):
        """Test that unauthorized requests return 401."""
        response = TestClient(app).get("/api/v1/portfolios")
        assert response.status_code == 401
