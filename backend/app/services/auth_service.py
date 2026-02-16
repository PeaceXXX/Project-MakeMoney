"""
Authentication service for user registration and verification.
"""
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, generate_verification_token, verify_token
from typing import Optional


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        """Create a new user."""
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise ValueError("Email already registered")

        # Validate passwords match
        if user.password != user.confirm_password:
            raise ValueError("Passwords do not match")

        # Create new user
        db_user = User(
            email=user.email,
            hashed_password=get_password_hash(user.password),
            full_name=user.full_name,
            is_active=True,
            email_verified=False
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def verify_email(db: Session, token: str) -> User:
        """Verify user email using token."""
        payload = verify_token(token)
        if payload is None:
            raise ValueError("Invalid or expired token")

        if payload.get("type") != "email_verification":
            raise ValueError("Invalid token type")

        email = payload.get("sub")
        user = AuthService.get_user_by_email(db, email)
        if user is None:
            raise ValueError("User not found")

        if user.email_verified:
            raise ValueError("Email already verified")

        user.email_verified = True
        db.commit()
        db.refresh(user)
        return user


auth_service = AuthService()
