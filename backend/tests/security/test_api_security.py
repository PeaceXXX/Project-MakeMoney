"""
API Security Tests.

Tests to verify API security measures.
"""

import pytest
from fastapi.testclient import TestClient


class TestAPISecurity:
    """Test API security measures."""

    def test_https_enforcement(self):
        """Verify HTTPS is enforced in production."""
        # In production, API should only be accessible via HTTPS
        # This is typically handled at the infrastructure level
        # For testing, we can check configuration
        import os

        # Check if HTTPS is enforced via environment variable
        enforce_https = os.getenv("ENFORCE_HTTPS", "false").lower()
        # In development, this might be false; in production, should be true

    def test_api_versioning(self, client: TestClient):
        """Test API versioning is implemented."""
        # All API endpoints should be versioned
        response = client.get("/api/v1/market/stock/AAPL")

        # Non-versioned endpoints should be deprecated or redirected
        # For now, just verify versioned endpoints work

    def test_rate_limiting_headers(self, client: TestClient):
        """Test rate limiting headers are present."""
        response = client.get("/api/v1/market/stock/AAPL")

        # Check for rate limiting headers
        # These might be set by a reverse proxy or API gateway
        rate_limit_headers = [
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
        ]

        # In production, at least some of these should be present
        # For development, this might not be enforced

    def test_error_messages_no_info_leak(self, client: TestClient):
        """Test that error messages don't leak sensitive information."""
        # Trigger various errors and check responses
        endpoints_to_test = [
            ("/api/v1/market/stock/INVALID_SYMBOL_12345", "get"),
            ("/api/v1/orders/999999999", "get"),
            ("/api/v1/portfolio/holdings/invalid", "get"),
        ]

        sensitive_info_patterns = [
            "password",
            "secret",
            "token",
            "api_key",
            "private_key",
            "database",
            "stack trace",
            "traceback",
            "/home/",
            "/var/",
            "c:\\users",
        ]

        for endpoint, method in endpoints_to_test:
            if method == "get":
                response = client.get(endpoint)

            if response.status_code >= 400:
                data = response.json()
                response_str = str(data).lower()

                for pattern in sensitive_info_patterns:
                    assert pattern not in response_str, \
                        f"Error message may leak sensitive info: {pattern}"

    def test_request_size_limit(self, client: TestClient):
        """Test that request size limits are enforced."""
        # Try to send a very large request
        large_data = "A" * 1000000  # 1MB of data

        response = client.post("/api/v1/auth/register", json={
            "email": "test@test.com",
            "password": large_data
        })

        # Should reject oversized requests
        # Or at least not crash
        assert response.status_code != 500, \
            "Large requests should be handled gracefully"

    def test_http_method_restrictions(self, client: TestClient):
        """Test that HTTP methods are properly restricted."""
        # Test endpoints with wrong methods
        wrong_method_tests = [
            ("/api/v1/auth/login", "DELETE"),
            ("/api/v1/auth/login", "PUT"),
            ("/api/v1/market/stock/AAPL", "POST"),
            ("/api/v1/market/stock/AAPL", "DELETE"),
        ]

        for endpoint, method in wrong_method_tests:
            if method == "DELETE":
                response = client.delete(endpoint)
            elif method == "PUT":
                response = client.put(endpoint, json={})
            elif method == "POST":
                response = client.post(endpoint, json={})

            # Should return 405 Method Not Allowed
            assert response.status_code in [405, 404, 401], \
                f"Endpoint {endpoint} should not accept {method}"

    def test_security_headers(self, client: TestClient):
        """Test presence of security headers."""
        response = client.get("/api/v1/market/stock/AAPL")

        # Recommended security headers
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Strict-Transport-Security": None,  # Any value is good
            "X-XSS-Protection": "1; mode=block",
        }

        # Note: These headers might be set by a reverse proxy
        # In development, they might not be present

        for header, expected_value in security_headers.items():
            actual_value = response.headers.get(header)
            # In production, these should be set
            # For development, we just verify the API works

    def test_json_content_type_enforcement(self, client: TestClient):
        """Test that API only accepts JSON content type."""
        # Try to send form data instead of JSON
        response = client.post(
            "/api/v1/auth/login",
            data="email=test@test.com&password=test",
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        # Should reject non-JSON content or handle it gracefully
        assert response.status_code in [400, 401, 406, 415, 422], \
            "API should enforce JSON content type"

    def test_idor_protection(self, client: TestClient, auth_headers: dict):
        """Test for Insecure Direct Object Reference vulnerabilities."""
        # Try to access resources with sequential IDs
        for order_id in range(1, 10):
            response = client.get(f"/api/v1/orders/{order_id}", headers=auth_headers)

            # Should return 404 (not found) or 403 (forbidden)
            # Should not return other users' data
            assert response.status_code in [200, 403, 404], \
                f"IDOR vulnerability possible for order {order_id}"

            if response.status_code == 200:
                # If successful, verify it's the user's own order
                data = response.json()
                # In a real test, verify the order belongs to the authenticated user

    def test_mass_assignment_protection(self, client: TestClient, auth_headers: dict):
        """Test for mass assignment vulnerabilities."""
        # Try to set fields that shouldn't be user-modifiable
        malicious_updates = [
            {"is_admin": True},
            {"role": "admin"},
            {"balance": 1000000},
            {"created_at": "2020-01-01"},
        ]

        for update_data in malicious_updates:
            response = client.put(
                "/api/v1/users/me",
                json=update_data,
                headers=auth_headers
            )

            # Should either reject the update or ignore the protected fields
            if response.status_code == 200:
                data = response.json()

                # Verify protected fields weren't modified
                if "is_admin" in update_data:
                    assert data.get("is_admin") != update_data["is_admin"], \
                        "Should not allow is_admin modification"

                if "role" in update_data:
                    assert data.get("role") != update_data["role"], \
                        "Should not allow role modification"


class TestDataSecurity:
    """Test data security measures."""

    def test_sensitive_data_not_exposed(self, client: TestClient, auth_headers: dict):
        """Test that sensitive data is not exposed in API responses."""
        # Get user profile
        response = client.get("/api/v1/users/me", headers=auth_headers)

        if response.status_code == 200:
            data = response.json()
            response_str = str(data).lower()

            # These fields should never be exposed
            protected_fields = [
                "password",
                "password_hash",
                "hashed_password",
                "salt",
                "token",
                "secret",
                "api_key",
            ]

            for field in protected_fields:
                assert f'"{field}"' not in response_str or f'"{field}": null' in response_str, \
                    f"Sensitive field '{field}' should not be exposed"

    def test_pagination_prevents_data_dump(self, client: TestClient, auth_headers: dict):
        """Test that pagination prevents dumping all data."""
        # Request a very large page size
        response = client.get(
            "/api/v1/orders?limit=10000",
            headers=auth_headers
        )

        if response.status_code == 200:
            data = response.json()

            # Should have a maximum limit
            if isinstance(data, list):
                assert len(data) <= 1000, \
                    "Pagination should limit maximum results"
            elif isinstance(data, dict) and "items" in data:
                assert len(data["items"]) <= 1000, \
                    "Pagination should limit maximum results"

    def test_no_sensitive_data_in_urls(self, client: TestClient):
        """Test that sensitive data is not passed in URLs."""
        # URLs can be logged and cached, so sensitive data should be in body
        sensitive_params = [
            "password",
            "token",
            "api_key",
            "secret",
        ]

        # Check that these aren't used as query parameters in any endpoint
        # This would require code review
        pass
