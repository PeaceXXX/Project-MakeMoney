"""
Pytest configuration and fixtures.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "password": "testpass123",
        "full_name": "Test User"
    }
