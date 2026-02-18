"""
Performance tests using Locust.

To run these tests:
1. Install locust: pip install locust
2. Run: locust -f backend/tests/performance/locustfile.py --host=http://localhost:8000
3. Open http://localhost:8089 in your browser
"""

import random
from locust import HttpUser, task, between


class TradingPlatformUser(HttpUser):
    """Simulates a user of the trading platform."""

    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks

    def on_start(self):
        """Run when a user starts - login and get auth token."""
        self.token = None
        self.login()

    def login(self):
        """Login and store the auth token."""
        response = self.client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword123"
        })
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")

    def get_headers(self):
        """Get authorization headers."""
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}

    @task(10)
    def view_market_data(self):
        """View market data - most common action."""
        symbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "META", "TSLA", "NVDA", "JPM", "V", "WMT"]
        symbol = random.choice(symbols)
        self.client.get(
            f"/api/v1/market/stock/{symbol}",
            headers=self.get_headers(),
            name="/market/stock/[symbol]"
        )

    @task(5)
    def view_portfolio(self):
        """View portfolio overview."""
        self.client.get(
            "/api/v1/portfolio",
            headers=self.get_headers()
        )

    @task(5)
    def view_holdings(self):
        """View portfolio holdings."""
        self.client.get(
            "/api/v1/portfolio/holdings",
            headers=self.get_headers()
        )

    @task(3)
    def view_order_history(self):
        """View order history."""
        self.client.get(
            "/api/v1/orders",
            headers=self.get_headers()
        )

    @task(3)
    def search_stocks(self):
        """Search for stocks."""
        queries = ["apple", "google", "micro", "amazon", "meta"]
        query = random.choice(queries)
        self.client.get(
            f"/api/v1/market/search?q={query}",
            headers=self.get_headers(),
            name="/market/search"
        )

    @task(2)
    def view_stock_history(self):
        """View historical stock data."""
        symbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "META"]
        symbol = random.choice(symbols)
        timeframes = ["1D", "1W", "1M", "3M", "6M", "1Y"]
        timeframe = random.choice(timeframes)
        self.client.get(
            f"/api/v1/market/stock/{symbol}/history?timeframe={timeframe}",
            headers=self.get_headers(),
            name="/market/stock/[symbol]/history"
        )

    @task(2)
    def view_watchlist(self):
        """View watchlist."""
        self.client.get(
            "/api/v1/market/watchlist",
            headers=self.get_headers()
        )

    @task(1)
    def place_market_order(self):
        """Place a market order (simulation)."""
        symbols = ["AAPL", "GOOGL", "MSFT"]
        symbol = random.choice(symbols)
        sides = ["buy", "sell"]
        side = random.choice(sides)

        self.client.post(
            "/api/v1/orders",
            headers=self.get_headers(),
            json={
                "symbol": symbol,
                "order_type": "market",
                "side": side,
                "quantity": random.randint(1, 10)
            },
            name="/orders (market)"
        )

    @task(1)
    def view_performance(self):
        """View performance analytics."""
        self.client.get(
            "/api/v1/portfolio/performance",
            headers=self.get_headers()
        )


class APIHeavyUser(HttpUser):
    """Simulates a user making heavy API calls."""

    wait_time = between(0.5, 2)

    def on_start(self):
        """Login at start."""
        self.token = None
        self.login()

    def login(self):
        """Login and store the auth token."""
        response = self.client.post("/api/v1/auth/login", json={
            "email": "api_user@example.com",
            "password": "testpassword123"
        })
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")

    def get_headers(self):
        """Get authorization headers."""
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}

    @task(20)
    def rapid_market_checks(self):
        """Rapidly check multiple stocks."""
        symbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "META"]
        for symbol in symbols:
            self.client.get(
                f"/api/v1/market/stock/{symbol}",
                headers=self.get_headers(),
                name="/market/stock (rapid)"
            )

    @task(10)
    def portfolio_refresh(self):
        """Frequently refresh portfolio data."""
        self.client.get(
            "/api/v1/portfolio",
            headers=self.get_headers()
        )
        self.client.get(
            "/api/v1/portfolio/holdings",
            headers=self.get_headers()
        )
        self.client.get(
            "/api/v1/portfolio/performance",
            headers=self.get_headers()
        )


class BrowseOnlyUser(HttpUser):
    """Simulates a user who only browses without trading."""

    wait_time = between(3, 10)

    @task(10)
    def browse_market(self):
        """Browse market data without authentication."""
        symbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "META", "TSLA", "NVDA"]
        symbol = random.choice(symbols)
        self.client.get(
            f"/api/v1/market/stock/{symbol}",
            name="/market/stock (public)"
        )

    @task(5)
    def search(self):
        """Search for stocks."""
        queries = ["tech", "bank", "energy", "retail", "healthcare"]
        query = random.choice(queries)
        self.client.get(
            f"/api/v1/market/search?q={query}",
            name="/market/search (public)"
        )

    @task(3)
    def view_indices(self):
        """View market indices."""
        self.client.get("/api/v1/market/indices")
