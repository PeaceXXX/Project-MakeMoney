"""
SQL Injection Security Tests.

Tests to verify that the application is protected against SQL injection attacks.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestSQLInjectionProtection:
    """Test SQL injection vulnerability protection."""

    def test_sql_injection_in_login_email(self, client: TestClient):
        """Test SQL injection attempts in login email field."""
        # Common SQL injection payloads
        sql_payloads = [
            "admin'--",
            "admin' OR '1'='1",
            "admin' OR '1'='1'--",
            "admin' OR '1'='1'/*",
            "' OR 1=1--",
            "' OR 1=1/*",
            "1' OR '1' = '1",
            "'; DROP TABLE users;--",
            "admin' UNION SELECT NULL--",
            "' UNION SELECT username, password FROM users--",
        ]

        for payload in sql_payloads:
            response = client.post("/api/v1/auth/login", json={
                "email": payload,
                "password": "testpassword"
            })

            # Should not return 200 (successful login)
            assert response.status_code in [400, 401, 422], \
                f"SQL injection payload '{payload}' may have succeeded"

            # Should not return database error messages
            if response.status_code == 400:
                data = response.json()
                error_msg = str(data.get("detail", "")).lower()
                assert "sql" not in error_msg
                assert "syntax" not in error_msg
                assert "mysql" not in error_msg
                assert "postgres" not in error_msg
                assert "sqlite" not in error_msg

    def test_sql_injection_in_registration(self, client: TestClient):
        """Test SQL injection attempts in registration fields."""
        sql_payloads = [
            "test'; DROP TABLE users;--",
            "test' OR '1'='1",
            "test\" OR \"1\"=\"1",
        ]

        for payload in sql_payloads:
            response = client.post("/api/v1/auth/register", json={
                "email": f"{payload}@test.com",
                "password": "TestPass123!",
                "username": payload
            })

            # Should not cause server error
            assert response.status_code in [400, 401, 409, 422], \
                f"SQL injection in registration may have succeeded with payload: {payload}"

    def test_sql_injection_in_stock_symbol(self, client: TestClient, auth_headers: dict):
        """Test SQL injection in stock symbol parameter."""
        sql_payloads = [
            "AAPL'; DROP TABLE stocks;--",
            "AAPL' OR '1'='1",
            "AAPL UNION SELECT * FROM users",
        ]

        for payload in sql_payloads:
            response = client.get(
                f"/api/v1/market/stock/{payload}",
                headers=auth_headers
            )

            # Should return 404 or 422, not 500
            assert response.status_code in [400, 401, 404, 422], \
                f"SQL injection in stock symbol may have succeeded"

    def test_sql_injection_in_order_parameters(self, client: TestClient, auth_headers: dict):
        """Test SQL injection in order parameters."""
        malicious_orders = [
            {
                "symbol": "AAPL'; DROP TABLE orders;--",
                "order_type": "market",
                "side": "buy",
                "quantity": 10
            },
            {
                "symbol": "AAPL",
                "order_type": "market",
                "side": "buy'; DELETE FROM orders WHERE '1'='1",
                "quantity": 10
            },
        ]

        for order in malicious_orders:
            response = client.post(
                "/api/v1/orders",
                json=order,
                headers=auth_headers
            )

            # Should not return 200 or 201
            assert response.status_code in [400, 401, 422], \
                f"SQL injection in order may have succeeded"

    def test_sql_injection_in_query_params(self, client: TestClient, auth_headers: dict):
        """Test SQL injection in query parameters."""
        sql_payloads = [
            "test'; DROP TABLE users;--",
            "test' UNION SELECT * FROM users--",
        ]

        for payload in sql_payloads:
            # Test search endpoint
            response = client.get(
                f"/api/v1/market/search?q={payload}",
                headers=auth_headers
            )

            # Should not return 500 error
            assert response.status_code != 500, \
                "SQL injection caused server error"

    def test_parameterized_queries_usage(self):
        """Verify that parameterized queries are used in the codebase."""
        # This is a code review test - check for unsafe string formatting in SQL
        import os
        import re

        unsafe_patterns = [
            r'execute\s*\(\s*f["\']',  # execute(f"...")
            r'execute\s*\(\s*["\'].*%s.*["\']\s*%',  # execute("...%s" % ...)
            r'\.format\s*\(',  # .format() in SQL strings
        ]

        # Check models and services for unsafe SQL patterns
        dirs_to_check = [
            "backend/app/models",
            "backend/app/services",
            "backend/app/api",
        ]

        issues_found = []

        for dir_path in dirs_to_check:
            if not os.path.exists(dir_path):
                continue

            for root, dirs, files in os.walk(dir_path):
                for file in files:
                    if file.endswith('.py'):
                        file_path = os.path.join(root, file)
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()

                            # Check for raw string concatenation in SQL
                            if 'SELECT' in content.upper() or 'INSERT' in content.upper():
                                for pattern in unsafe_patterns:
                                    if re.search(pattern, content):
                                        issues_found.append(f"{file_path}: Potential unsafe SQL pattern found")

        # This test should pass if no unsafe patterns are found
        assert len(issues_found) == 0, \
            f"Potential SQL injection vulnerabilities found: {issues_found}"
