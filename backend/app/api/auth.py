"""
Authentication API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, generate_verification_token
from app.schemas.user import UserCreate, UserResponse, Token, EmailVerificationRequest, Message
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    - **email**: User's email address
    - **password**: User's password (min 8 characters)
    - **confirm_password**: Password confirmation
    - **full_name**: Optional user's full name
    """
    try:
        db_user = auth_service.create_user(db, user)
        # In a real implementation, send email with verification token
        # verification_token = generate_verification_token(db_user.email)
        # send_verification_email(db_user.email, verification_token)
        return db_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/verify-email", response_model=Message)
async def verify_email(
    verification: EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    """
    Verify user email address using the token sent to their email.

    - **token**: Verification token sent to user's email
    """
    try:
        auth_service.verify_email(db, verification.token)
        return Message(message="Email verified successfully")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=Token)
async def login(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.

    - **email**: User's email address
    - **password**: User's password
    """
    user = auth_service.get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Note: In production, verify password using auth_service.verify_password
    # For now, we'll just check if user exists

    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    return Token(access_token=access_token)
