"""
Tests for authentication endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.models.user import User
from sqlalchemy.orm import Session


client = TestClient(app)


def test_register_new_user(db: Session):
    """Test registering a new user."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "testpass123",
            "confirm_password": "testpass123",
            "full_name": "Test User"
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "Test User"
    assert data["email_verified"] == False
    assert "id" in data


def test_register_duplicate_email(db: Session):
    """Test registering with duplicate email fails."""
    # Register first user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "testpass123",
            "confirm_password": "testpass123"
        }
    )

    # Try to register same email again
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "testpass123",
            "confirm_password": "testpass123"
        }
    )

    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_register_password_mismatch(db: Session):
    """Test registering with mismatched passwords fails."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpass123",
            "confirm_password": "differentpass"
        }
    )

    assert response.status_code == 400
    assert "do not match" in response.json()["detail"].lower()


def test_register_short_password(db: Session):
    """Test registering with short password fails."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "short",
            "confirm_password": "short"
        }
    )

    assert response.status_code == 422  # Validation error


def test_login(db: Session):
    """Test user login."""
    # Register user first
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "loginuser@example.com",
            "password": "testpass123",
            "confirm_password": "testpass123"
        }
    )

    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "loginuser@example.com",
            "password": "testpass123"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(db: Session):
    """Test login with invalid credentials fails."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "wrongpass"
        }
    )

    assert response.status_code == 401


def test_verify_email_invalid_token(db: Session):
    """Test email verification with invalid token."""
    response = client.post(
        "/api/v1/auth/verify-email",
        json={"token": "invalid_token"}
    )

    assert response.status_code == 400
