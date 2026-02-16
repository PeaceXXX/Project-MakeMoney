"""
API key service for API access management.
"""
import json
from datetime import datetime, timedelta
from typing import List, Optional
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.api_keys import APIKey
from app.schemas.api_keys import (
    APIKeyCreate,
    APIKeyUpdate,
    APIKeyResponse,
    APIKeyWithKey
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_api_key(db: Session, user: User, key_data: APIKeyCreate) -> APIKeyWithKey:
    """
    Create a new API key for a user.

    Args:
        db: Database session
        user: User object
        key_data: API key creation data

    Returns:
        APIKeyWithKey object containing the created key and the key value
    """
    # Generate API key
    api_key_value = APIKey.generate_key()

    # Hash the key for storage
    key_hash = pwd_context.hash(api_key_value)

    # Calculate expiration date if provided
    expires_at = None
    if key_data.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=key_data.expires_in_days)

    # Serialize scopes to JSON
    scopes_json = None
    if key_data.scopes:
        scopes_json = json.dumps(key_data.scopes)

    # Create API key
    db_key = APIKey(
        user_id=user.id,
        name=key_data.name,
        key_hash=key_hash,
        is_active=True,
        expires_at=expires_at,
        scopes=scopes_json
    )

    db.add(db_key)
    db.commit()
    db.refresh(db_key)

    # Return response with key value
    return APIKeyWithKey(
        id=db_key.id,
        user_id=db_key.user_id,
        name=db_key.name,
        is_active=db_key.is_active,
        last_used_at=db_key.last_used_at,
        expires_at=db_key.expires_at,
        created_at=db_key.created_at,
        revoked_at=db_key.revoked_at,
        scopes=key_data.scopes,
        key=api_key_value
    )


def get_user_api_keys(db: Session, user: User) -> List[APIKey]:
    """
    Get all API keys for a user.

    Args:
        db: Database session
        user: User object

    Returns:
        List of APIKey objects
    """
    return db.query(APIKey).filter(APIKey.user_id == user.id).all()


def get_api_key(db: Session, key_id: int, user: User) -> Optional[APIKey]:
    """
    Get a specific API key by ID for a user.

    Args:
        db: Database session
        key_id: API key ID
        user: User object

    Returns:
        APIKey object or None
    """
    return db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == user.id
    ).first()


def get_api_key_by_key(db: Session, key_value: str) -> Optional[APIKey]:
    """
    Get an API key by its value.

    Args:
        db: Database session
        key_value: API key value

    Returns:
        APIKey object or None
    """
    # Get all active API keys and check each one
    keys = db.query(APIKey).filter(APIKey.is_active == True).all()

    for key in keys:
        if pwd_context.verify(key_value, key.key_hash):
            # Check if key is expired
            if key.expires_at and key.expires_at < datetime.utcnow():
                return None
            return key

    return None


def update_api_key(db: Session, key_id: int, user: User, key_data: APIKeyUpdate) -> APIKeyResponse:
    """
    Update an API key.

    Args:
        db: Database session
        key_id: API key ID
        user: User object
        key_data: API key update data

    Returns:
        Updated APIKeyResponse object
    """
    api_key = get_api_key(db, key_id, user)
    if not api_key:
        raise ValueError("API key not found")

    # Update fields
    if key_data.name is not None:
        api_key.name = key_data.name

    if key_data.scopes is not None:
        api_key.scopes = json.dumps(key_data.scopes) if key_data.scopes else None

    db.commit()
    db.refresh(api_key)

    # Deserialize scopes
    scopes = json.loads(api_key.scopes) if api_key.scopes else None

    return APIKeyResponse(
        id=api_key.id,
        user_id=api_key.user_id,
        name=api_key.name,
        is_active=api_key.is_active,
        last_used_at=api_key.last_used_at,
        expires_at=api_key.expires_at,
        created_at=api_key.created_at,
        revoked_at=api_key.revoked_at,
        scopes=scopes
    )


def revoke_api_key(db: Session, key_id: int, user: User, reason: Optional[str] = None) -> APIKeyResponse:
    """
    Revoke an API key.

    Args:
        db: Database session
        key_id: API key ID
        user: User object
        reason: Optional reason for revocation

    Returns:
        Revoked APIKeyResponse object
    """
    api_key = get_api_key(db, key_id, user)
    if not api_key:
        raise ValueError("API key not found")

    if not api_key.is_active:
        raise ValueError("API key is already revoked")

    api_key.is_active = False
    api_key.revoked_at = datetime.utcnow()

    db.commit()
    db.refresh(api_key)

    # Deserialize scopes
    scopes = json.loads(api_key.scopes) if api_key.scopes else None

    return APIKeyResponse(
        id=api_key.id,
        user_id=api_key.user_id,
        name=api_key.name,
        is_active=api_key.is_active,
        last_used_at=api_key.last_used_at,
        expires_at=api_key.expires_at,
        created_at=api_key.created_at,
        revoked_at=api_key.revoked_at,
        scopes=scopes
    )


def update_last_used(db: Session, api_key: APIKey):
    """
    Update the last used timestamp for an API key.

    Args:
        db: Database session
        api_key: APIKey object
    """
    api_key.last_used_at = datetime.utcnow()
    db.commit()


def delete_api_key(db: Session, key_id: int, user: User) -> bool:
    """
    Delete an API key.

    Args:
        db: Database session
        key_id: API key ID
        user: User object

    Returns:
        True if deleted, False otherwise
    """
    api_key = get_api_key(db, key_id, user)
    if not api_key:
        return False

    db.delete(api_key)
    db.commit()
    return True
