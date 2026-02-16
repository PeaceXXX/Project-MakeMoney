"""
Portfolio API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.schemas.portfolio import PortfolioCreate, PortfolioResponse, HoldingCreate, HoldingResponse, Message
from app.schemas.user import UserResponse
from app.services.portfolio_service import portfolio_service

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get("", response_model=List[PortfolioResponse])
async def get_portfolios(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get all portfolios for the current user.

    Returns list of portfolios with their holding counts.
    """
    portfolios = portfolio_service.get_portfolios(db, current_user.id)

    # Add holding count to each portfolio
    response = []
    for portfolio in portfolios:
        portfolio_dict = {
            "id": portfolio.id,
            "user_id": portfolio.user_id,
            "name": portfolio.name,
            "description": portfolio.description,
            "created_at": portfolio.created_at,
            "updated_at": portfolio.updated_at,
            "holdings_count": len(portfolio.holdings) if portfolio.holdings else 0
        }
        response.append(portfolio_dict)

    return response


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get a specific portfolio by ID.

    - **portfolio_id**: Portfolio ID
    """
    portfolio = portfolio_service.get_portfolio(db, portfolio_id, current_user.id)
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    return PortfolioResponse(
        id=portfolio.id,
        user_id=portfolio.user_id,
        name=portfolio.name,
        description=portfolio.description,
        created_at=portfolio.created_at,
        updated_at=portfolio.updated_at,
        holdings_count=len(portfolio.holdings) if portfolio.holdings else 0
    )


@router.post("", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    portfolio: PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Create a new portfolio.

    - **name**: Portfolio name (required)
    - **description**: Optional portfolio description
    """
    try:
        db_portfolio = portfolio_service.create_portfolio(db, portfolio, current_user.id)
        return PortfolioResponse(
            id=db_portfolio.id,
            user_id=db_portfolio.user_id,
            name=db_portfolio.name,
            description=db_portfolio.description,
            created_at=db_portfolio.created_at,
            updated_at=db_portfolio.updated_at,
            holdings_count=0
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(
    portfolio_id: int,
    name: str = None,
    description: str = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Update a portfolio.

    - **portfolio_id**: Portfolio ID
    - **name**: Optional new name
    - **description**: Optional new description
    """
    try:
        from app.schemas.portfolio import PortfolioUpdate
        update_data = PortfolioUpdate()
        if name is not None:
            update_data.name = name
        if description is not None:
            update_data.description = description

        portfolio = portfolio_service.update_portfolio(db, portfolio_id, current_user.id, update_data)
        return PortfolioResponse(
            id=portfolio.id,
            user_id=portfolio.user_id,
            name=portfolio.name,
            description=portfolio.description,
            created_at=portfolio.created_at,
            updated_at=portfolio.updated_at,
            holdings_count=len(portfolio.holdings) if portfolio.holdings else 0
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{portfolio_id}", response_model=Message)
async def delete_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Delete a portfolio.

    - **portfolio_id**: Portfolio ID
    """
    try:
        portfolio_service.delete_portfolio(db, portfolio_id, current_user.id)
        return Message(message="Portfolio deleted successfully")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/{portfolio_id}/holdings", response_model=List[HoldingResponse])
async def get_holdings(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get all holdings for a portfolio.

    - **portfolio_id**: Portfolio ID
    """
    # Verify portfolio belongs to user
    portfolio = portfolio_service.get_portfolio(db, portfolio_id, current_user.id)
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    holdings = portfolio_service.get_holdings(db, portfolio_id, current_user.id)

    # Convert to response format
    response = []
    for holding in holdings:
        holding_dict = {
            "id": holding.id,
            "portfolio_id": holding.portfolio_id,
            "symbol": holding.symbol,
            "quantity": holding.quantity,
            "purchase_price": holding.purchase_price,
            "created_at": holding.created_at,
            "updated_at": holding.updated_at,
            "current_price": None  # Would be fetched from market data API
        }
        response.append(holding_dict)

    return response


@router.post("/{portfolio_id}/holdings", response_model=HoldingResponse, status_code=status.HTTP_201_CREATED)
async def create_holding(
    portfolio_id: int,
    holding: HoldingCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Create a new holding.

    - **portfolio_id**: Portfolio ID
    - **symbol**: Stock symbol (required)
    - **quantity**: Number of shares (required)
    - **purchase_price**: Purchase price (required)
    """
    try:
        db_holding = portfolio_service.create_holding(db, holding, portfolio_id, current_user.id)
        return HoldingResponse(
            id=db_holding.id,
            portfolio_id=db_holding.portfolio_id,
            symbol=db_holding.symbol,
            quantity=db_holding.quantity,
            purchase_price=db_holding.purchase_price,
            created_at=db_holding.created_at,
            updated_at=db_holding.updated_at,
            current_price=None
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/holdings/{holding_id}", response_model=HoldingResponse)
async def update_holding(
    holding_id: int,
    portfolio_id: int,
    quantity: int = None,
    purchase_price: float = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Update a holding.

    - **holding_id**: Holding ID
    - **portfolio_id**: Portfolio ID (for verification)
    - **quantity**: Optional new quantity
    - **purchase_price**: Optional new purchase price
    """
    try:
        holding = portfolio_service.update_holding(
            db, holding_id, portfolio_id, current_user.id, quantity, purchase_price
        )
        return HoldingResponse(
            id=holding.id,
            portfolio_id=holding.portfolio_id,
            symbol=holding.symbol,
            quantity=holding.quantity,
            purchase_price=holding.purchase_price,
            created_at=holding.created_at,
            updated_at=holding.updated_at,
            current_price=None
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/holdings/{holding_id}", response_model=Message)
async def delete_holding(
    holding_id: int,
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Delete a holding.

    - **holding_id**: Holding ID
    - **portfolio_id**: Portfolio ID (for verification)
    """
    try:
        portfolio_service.delete_holding(db, holding_id, portfolio_id, current_user.id)
        return Message(message="Holding deleted successfully")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
