"""
Pytest configuration and fixtures.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import Base, get_db


# Test database engine (in-memory SQLite for isolation)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a clean database session for each test with automatic cleanup."""
    # Create all tables
    Base.metadata.create_all(bind=test_engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        # Cleanup: close session
        session.close()
        # Drop all tables for complete isolation
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client for the FastAPI app with isolated database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    # Clear dependency overrides after test
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "password": "testpass123",
        "full_name": "Test User"
    }


@pytest.fixture
def cleanup_files():
    """Fixture to track and cleanup files created during tests."""
    files_to_cleanup = []

    def add_file(filepath):
        files_to_cleanup.append(filepath)

    yield add_file

    # Cleanup all tracked files
    import os
    for filepath in files_to_cleanup:
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception:
            pass


@pytest.fixture
def cleanup_env():
    """Fixture to track and restore environment variables."""
    import os
    original_env = dict(os.environ)
    changed_keys = []

    def set_env(key, value):
        changed_keys.append(key)
        os.environ[key] = value

    yield set_env

    # Restore original environment
    for key in changed_keys:
        if key in original_env:
            os.environ[key] = original_env[key]
        elif key in os.environ:
            del os.environ[key]


@pytest.fixture(autouse=True)
def reset_singletons():
    """Automatically reset any singleton instances between tests."""
    # Reset any singleton instances here if needed
    yield
    # Add singleton reset logic here


@pytest.fixture
def isolated_test():
    """
    Context manager for completely isolated test execution.
    Ensures no state leaks between tests.
    """
    from contextlib import contextmanager

    @contextmanager
    def _isolated():
        # Pre-test setup
        Base.metadata.create_all(bind=test_engine)
        session = TestingSessionLocal()

        try:
            yield session
        finally:
            # Post-test cleanup
            session.close()
            Base.metadata.drop_all(bind=test_engine)

    return _isolated
