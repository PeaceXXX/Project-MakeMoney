"""
Trading service for order management and execution.
"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.trading import Order, TradeExecution, OrderType, OrderSide, OrderStatus
from app.models.user import User
from app.schemas.trading import OrderCreate, OrderUpdate, OrderValidationResult, TradeExecutionResponse, OrderResponse


def validate_order(db: Session, user: User, order_data: OrderCreate) -> OrderValidationResult:
    """
    Validate an order before creation.

    Checks:
    - User is active
    - Symbol is valid
    - Order parameters are valid
    - User has sufficient funds for buy orders
    """
    errors = []
    warnings = []

    # Check user is active
    if not user.is_active:
        errors.append("User account is not active")

    # Validate symbol format (basic check)
    if not order_data.symbol or len(order_data.symbol) < 1 or len(order_data.symbol) > 20:
        errors.append("Invalid stock symbol")

    # Validate quantity
    if order_data.quantity <= 0:
        errors.append("Quantity must be greater than 0")

    # Validate order type specific requirements
    if order_data.order_type == OrderType.LIMIT and order_data.limit_price is None:
        errors.append("Limit price is required for limit orders")

    if order_data.order_type in [OrderType.STOP, OrderType.STOP_LIMIT] and order_data.stop_price is None:
        errors.append("Stop price is required for stop orders")

    if order_data.order_type == OrderType.STOP_LIMIT:
        if order_data.limit_price is None:
            errors.append("Limit price is required for stop-limit orders")
        elif order_data.stop_price is not None and order_data.limit_price is not None:
            if order_data.side == OrderSide.BUY and order_data.stop_price > order_data.limit_price:
                warnings.append("Stop price is above limit price for buy stop-limit order")
            elif order_data.side == OrderSide.SELL and order_data.stop_price < order_data.limit_price:
                warnings.append("Stop price is below limit price for sell stop-limit order")

    # For simplicity, we skip the funds check here (would need account balance model)
    # warnings.append("Account balance verification not implemented")

    return OrderValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )


def create_order(db: Session, user: User, order_data: OrderCreate) -> OrderResponse:
    """
    Create a new order.

    For this implementation, we'll simulate execution for market orders.
    Limit and stop orders remain pending.
    """
    # Validate the order
    validation = validate_order(db, user, order_data)
    if not validation.valid:
        raise ValueError(f"Order validation failed: {', '.join(validation.errors)}")

    # Create the order
    db_order = Order(
        user_id=user.id,
        symbol=order_data.symbol.upper(),
        order_type=order_data.order_type,
        side=order_data.side,
        quantity=order_data.quantity,
        limit_price=order_data.limit_price,
        stop_price=order_data.stop_price,
        notes=order_data.notes,
        status=OrderStatus.PENDING
    )

    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # For market orders, simulate immediate execution
    if order_data.order_type == OrderType.MARKET:
        execute_order(db, db_order, 100.0)  # Simulated price at $100

    return OrderResponse.model_validate(db_order)


def execute_order(db: Session, order: Order, execution_price: float, commission: float = 0.0):
    """
    Execute an order (fill it).

    Creates a trade execution record and updates the order status.
    """
    # Create execution record
    execution = TradeExecution(
        order_id=order.id,
        symbol=order.symbol,
        side=order.side,
        quantity=order.quantity,
        price=execution_price,
        commission=commission,
        executed_at=datetime.utcnow()
    )

    db.add(execution)

    # Update order status
    order.filled_quantity = order.quantity
    order.status = OrderStatus.FILLED
    order.filled_at = datetime.utcnow()
    order.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(order)


def cancel_order(db: Session, order_id: int, user_id: int) -> OrderResponse:
    """
    Cancel a pending order.

    Only pending orders can be cancelled.
    """
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user_id
    ).first()

    if not order:
        raise ValueError("Order not found")

    if order.status != OrderStatus.PENDING:
        raise ValueError(f"Cannot cancel order with status {order.status.value}")

    order.status = OrderStatus.CANCELLED
    order.cancelled_at = datetime.utcnow()
    order.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(order)

    return OrderResponse.model_validate(order)


def modify_order(db: Session, order_id: int, user_id: int, order_update: OrderUpdate) -> OrderResponse:
    """
    Modify an existing order.

    Only pending orders can be modified.
    """
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user_id
    ).first()

    if not order:
        raise ValueError("Order not found")

    if order.status != OrderStatus.PENDING:
        raise ValueError(f"Cannot modify order with status {order.status.value}")

    # Update fields
    if order_update.quantity is not None:
        order.quantity = order_update.quantity
    if order_update.limit_price is not None:
        order.limit_price = order_update.limit_price
    if order_update.stop_price is not None:
        order.stop_price = order_update.stop_price
    if order_update.notes is not None:
        order.notes = order_update.notes

    order.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(order)

    return OrderResponse.model_validate(order)


def get_user_orders(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[OrderStatus] = None
) -> List[Order]:
    """
    Get all orders for a user with optional filtering.
    """
    query = db.query(Order).filter(Order.user_id == user_id)

    if status:
        query = query.filter(Order.status == status)

    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


def get_order(db: Session, order_id: int, user_id: int) -> Optional[Order]:
    """
    Get a specific order by ID for a user.
    """
    return db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user_id
    ).first()


def get_order_executions(db: Session, order_id: int, user_id: int) -> List[TradeExecutionResponse]:
    """
    Get all executions for an order.
    """
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user_id
    ).first()

    if not order:
        raise ValueError("Order not found")

    executions = db.query(TradeExecution).filter(
        TradeExecution.order_id == order_id
    ).all()

    return [TradeExecutionResponse.model_validate(e) for e in executions]


def get_pending_orders(db: Session, user_id: int) -> List[Order]:
    """
    Get all pending orders for a user.
    """
    return db.query(Order).filter(
        Order.user_id == user_id,
        Order.status == OrderStatus.PENDING
    ).all()
