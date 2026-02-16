"""
API key schemas for API access management.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class APIKeyBase(BaseModel):
    """Base API key schema."""
    name: str = Field(..., min_length=1, max_length=100)


class APIKeyCreate(APIKeyBase):
    """Schema for creating a new API key."""
    scopes: Optional[List[str]] = Field(default=None, description="List of allowed scopes")
    expires_in_days: Optional[int] = Field(None, gt=0, le=365, description="Days until key expires")


class APIKeyResponse(BaseModel):
    """Schema for API key response (without the actual key)."""
    id: int
    user_id: int
    name: str
    is_active: bool
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
    revoked_at: Optional[datetime]
    scopes: Optional[List[str]] = None

    class Config:
        from_attributes = True


class APIKeyWithKey(APIKeyResponse):
    """Schema for API key response with the actual key (only shown on creation)."""
    key: str


class APIKeyUpdate(BaseModel):
    """Schema for updating an API key."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    scopes: Optional[List[str]] = None


class APIKeyRevoke(BaseModel):
    """Schema for revoking an API key."""
    reason: Optional[str] = Field(None, max_length=500)


class APIUsage(BaseModel):
    """Schema for API usage statistics."""
    total_requests: int
    requests_this_month: int
    requests_today: int
    rate_limit_remaining: int


class APIKeyListResponse(BaseModel):
    """Schema for paginated API key list response."""
    keys: List[APIKeyResponse]
    total: int
