"""
API key management endpoints for programmatic access.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.api_keys import APIKey
from app.schemas.api_keys import (
    APIKeyCreate,
    APIKeyUpdate,
    APIKeyResponse,
    APIKeyWithKey,
    APIKeyListResponse,
    APIKeyRevoke
)
from app.services.api_key_service import (
    create_api_key,
    get_user_api_keys,
    get_api_key,
    get_api_key_by_key,
    update_api_key,
    revoke_api_key,
    update_last_used,
    delete_api_key
)


router = APIRouter()


@router.post("/api-keys", response_model=APIKeyWithKey, status_code=status.HTTP_201_CREATED)
def create_api_key_endpoint(
    key_data: APIKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate a new API key for programmatic access.

    The key will only be shown once. Store it securely.
    """
    try:
        return create_api_key(db, current_user, key_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create API key: {str(e)}"
        )


@router.get("/api-keys", response_model=APIKeyListResponse)
def get_api_keys_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all API keys for the current user.

    Note: The actual key values are not returned for security reasons.
    """
    keys = get_user_api_keys(db, current_user)
    return APIKeyListResponse(
        keys=[APIKeyResponse.model_validate(k) for k in keys],
        total=len(keys)
    )


@router.get("/api-keys/{key_id}", response_model=APIKeyResponse)
def get_api_key_endpoint(
    key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific API key by ID.
    """
    api_key = get_api_key(db, key_id, current_user)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    return APIKeyResponse.model_validate(api_key)


@router.put("/api-keys/{key_id}", response_model=APIKeyResponse)
def update_api_key_endpoint(
    key_id: int,
    key_data: APIKeyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an existing API key.

    Can only update name and scopes, not the key value itself.
    """
    try:
        return update_api_key(db, key_id, current_user, key_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/api-keys/{key_id}/revoke", response_model=APIKeyResponse)
def revoke_api_key_endpoint(
    key_id: int,
    revoke_data: APIKeyRevoke = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Revoke an API key.

    The key will no longer be valid for API authentication.
    """
    try:
        reason = revoke_data.reason if revoke_data else None
        return revoke_api_key(db, key_id, current_user, reason)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key_endpoint(
    key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an API key permanently.

    Warning: This action cannot be undone.
    """
    success = delete_api_key(db, key_id, current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    return None


# Dependency for API key authentication
async def get_api_key_user(
    x_api_key: str = Header(..., description="API key for authentication"),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to authenticate requests using API key.

    Returns the user associated with the API key.
    """
    api_key = get_api_key_by_key(db, x_api_key)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )

    # Check if user is active
    if not api_key.user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active"
        )

    # Update last used timestamp
    update_last_used(db, api_key)

    return api_key.user
