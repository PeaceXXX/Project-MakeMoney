"""
Authentication API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, generate_verification_token
from app.schemas.user import UserCreate, UserResponse, Token, EmailVerificationRequest, Message, UserLogin, PasswordResetRequest, PasswordResetConfirm
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
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.

    - **email**: User's email address
    - **password**: User's password
    """
    try:
        user = auth_service.authenticate_user(db, credentials.email, credentials.password)
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        return Token(access_token=access_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/logout", response_model=Message)
async def logout():
    """
    Logout user.

    Note: The actual logout happens on the client side by removing the stored token.
    This endpoint exists for future extensions and for maintaining RESTful conventions.
    """
    return Message(message="Logout successful. Please clear your stored token.")


@router.post("/password-reset-request", response_model=Message)
async def request_password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset.

    - **email**: User's email address
    """
    try:
        auth_service.request_password_reset(db, request.email)
        return Message(message="If the email is registered, a password reset link will be sent.")
    except ValueError as e:
        # Don't reveal if email exists for security
        return Message(message="If the email is registered, a password reset link will be sent.")


@router.post("/password-reset", response_model=Message)
async def reset_password(
    request: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Reset user password using token.

    - **token**: Password reset token sent to user's email
    - **new_password**: New password
    - **confirm_password**: Confirm new password
    """
    try:
        # Validate passwords match
        if request.new_password != request.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )

        auth_service.reset_password(db, request.token, request.new_password)
        return Message(message="Password reset successfully. You can now login with your new password.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
