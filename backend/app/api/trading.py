"""
Trading API endpoints for order management.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.trading import OrderStatus
from app.schemas.trading import (
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    OrderDetail,
    OrderListResponse,
    OrderConfirmation,
    OrderValidationResult,
    TradeExecutionResponse
)
from app.services.trading_service import (
    create_order,
    cancel_order,
    modify_order,
    get_user_orders,
    get_order,
    get_order_executions,
    get_pending_orders,
    validate_order
)


router = APIRouter()


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new trading order.

    Supports market, limit, stop, and stop-limit orders.
    """
    try:
        order = create_order(db, current_user, order_data)
        return order
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )


@router.get("/orders", response_model=OrderListResponse)
def get_orders(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Number of records to return"),
    status_filter: Optional[str] = Query(None, description="Filter by order status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all orders for the current user.

    Supports pagination and status filtering.
    """
    # Parse status filter if provided
    order_status = None
    if status_filter:
        try:
            order_status = OrderStatus(status_filter)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid order status: {status_filter}"
            )

    orders = get_user_orders(db, current_user.id, skip, limit, order_status)
    total = len(get_user_orders(db, current_user.id, 0, 100000, order_status))

    return OrderListResponse(
        orders=[OrderResponse.model_validate(o) for o in orders],
        total=total,
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/orders/pending", response_model=List[OrderResponse])
def get_pending_orders_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all pending orders for the current user.
    """
    orders = get_pending_orders(db, current_user.id)
    return [OrderResponse.model_validate(o) for o in orders]


@router.get("/orders/short-positions")
def get_short_positions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all open short positions for the current user.
    """
    # For now, return mock data since short positions aren't fully implemented
    # In a real implementation, this would query the database for short positions
    return {
        "positions": [],
        "total": 0
    }


@router.post("/orders/validate", response_model=OrderValidationResult)
def validate_order_endpoint(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Validate an order before creation.

    Returns validation result with errors and warnings.
    """
    return validate_order(db, current_user, order_data)


@router.post("/orders/risk-check")
def risk_check_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Perform pre-trade risk check on an order.
    """
    # For now, return a basic risk check result
    # In a real implementation, this would perform comprehensive risk analysis
    return {
        "passed": True,
        "warnings": [],
        "errors": [],
        "details": {
            "order_value": (order_data.quantity or 0) * (order_data.limit_price or 100),
            "account_balance": 100000,
            "available_cash": 75000,
            "position_concentration": 5.0,
            "daily_trades": 0,
            "max_daily_trades": 25,
            "order_percent_of_portfolio": 5.0,
            "max_order_percent": 25
        }
    }


@router.get("/orders/{order_id}", response_model=OrderDetail)
def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get detailed information about an order including executions.
    """
    order = get_order(db, order_id, current_user.id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    executions = get_order_executions(db, order_id, current_user.id)

    return OrderDetail(
        **OrderResponse.model_validate(order).model_dump(),
        executions=executions
    )


@router.put("/orders/{order_id}", response_model=OrderResponse)
def modify_order_endpoint(
    order_id: int,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Modify an existing order.

    Only pending orders can be modified.
    """
    try:
        order = modify_order(db, order_id, current_user.id, order_update)
        return order
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/orders/{order_id}", response_model=OrderResponse)
def cancel_order_endpoint(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Cancel a pending order.

    Only pending orders can be cancelled.
    """
    try:
        order = cancel_order(db, order_id, current_user.id)
        return order
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/orders/{order_id}/executions", response_model=List[TradeExecutionResponse])
def get_order_executions_endpoint(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all executions for a specific order.
    """
    try:
        executions = get_order_executions(db, order_id, current_user.id)
        return executions
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
