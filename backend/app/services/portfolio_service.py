"""
Portfolio service for managing portfolios and holdings.
"""
from sqlalchemy.orm import Session
from app.models.portfolio import Portfolio, Holding
from app.models.user import User
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate, HoldingCreate, PerformanceMetrics
from typing import Optional, List


class PortfolioService:
    """Service for portfolio operations."""

    @staticmethod
    def get_portfolios(db: Session, user_id: int) -> List[Portfolio]:
        """Get all portfolios for a user."""
        return db.query(Portfolio).filter(Portfolio.user_id == user_id).all()

    @staticmethod
    def get_portfolio(db: Session, portfolio_id: int, user_id: int) -> Optional[Portfolio]:
        """Get a specific portfolio by ID."""
        portfolio = db.query(Portfolio).filter(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user_id
        ).first()
        return portfolio

    @staticmethod
    def create_portfolio(db: Session, portfolio: PortfolioCreate, user_id: int) -> Portfolio:
        """Create a new portfolio."""
        db_portfolio = Portfolio(
            user_id=user_id,
            name=portfolio.name,
            description=portfolio.description
        )
        db.add(db_portfolio)
        db.commit()
        db.refresh(db_portfolio)
        return db_portfolio

    @staticmethod
    def update_portfolio(db: Session, portfolio_id: int, user_id: int, update_data: PortfolioUpdate) -> Portfolio:
        """Update an existing portfolio."""
        portfolio = PortfolioService.get_portfolio(db, portfolio_id, user_id)
        if portfolio is None:
            raise ValueError("Portfolio not found")

        if update_data.name is not None:
            portfolio.name = update_data.name
        if update_data.description is not None:
            portfolio.description = update_data.description

        db.commit()
        db.refresh(portfolio)
        return portfolio

    @staticmethod
    def delete_portfolio(db: Session, portfolio_id: int, user_id: int) -> None:
        """Delete a portfolio."""
        portfolio = PortfolioService.get_portfolio(db, portfolio_id, user_id)
        if portfolio is None:
            raise ValueError("Portfolio not found")

        db.delete(portfolio)
        db.commit()

    @staticmethod
    def get_holdings(db: Session, portfolio_id: int, user_id: int) -> List[Holding]:
        """Get all holdings for a portfolio."""
        return db.query(Holding).filter(Holding.portfolio_id == portfolio_id).all()

    @staticmethod
    def create_holding(db: Session, holding: HoldingCreate, portfolio_id: int, user_id: int) -> Holding:
        """Create a new holding."""
        # Verify portfolio exists and belongs to user
        portfolio = PortfolioService.get_portfolio(db, portfolio_id, user_id)
        if portfolio is None:
            raise ValueError("Portfolio not found")

        db_holding = Holding(
            portfolio_id=portfolio_id,
            symbol=holding.symbol.upper(),
            quantity=holding.quantity,
            purchase_price=holding.purchase_price
        )
        db.add(db_holding)
        db.commit()
        db.refresh(db_holding)
        return db_holding

    @staticmethod
    def update_holding(db: Session, holding_id: int, portfolio_id: int, user_id: int, quantity: Optional[int] = None, purchase_price: Optional[float] = None) -> Holding:
        """Update an existing holding."""
        # Get holding and verify it belongs to user's portfolio
        holding = db.query(Holding).filter(
            Holding.id == holding_id,
            Holding.portfolio_id == portfolio_id
        ).first()

        if holding is None:
            raise ValueError("Holding not found")

        # Verify portfolio belongs to user
        portfolio = db.query(Portfolio).filter(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user_id
        ).first()

        if portfolio is None:
            raise ValueError("Portfolio not found")

        if quantity is not None:
            holding.quantity = quantity
        if purchase_price is not None:
            holding.purchase_price = purchase_price

        db.commit()
        db.refresh(holding)
        return holding

    @staticmethod
    def delete_holding(db: Session, holding_id: int, portfolio_id: int, user_id: int) -> None:
        """Delete a holding."""
        # Get holding and verify it belongs to user's portfolio
        holding = db.query(Holding).filter(
            Holding.id == holding_id,
            Holding.portfolio_id == portfolio_id
        ).first()

        if holding is None:
            raise ValueError("Holding not found")

        db.delete(holding)
        db.commit()


    @staticmethod
    def calculate_performance(db: Session, portfolio_id: int, user_id: int) -> PerformanceMetrics:
        """Calculate portfolio performance metrics."""
        portfolio = PortfolioService.get_portfolio(db, portfolio_id, user_id)
        if portfolio is None:
            raise ValueError("Portfolio not found")

        holdings = PortfolioService.get_holdings(db, portfolio_id, user_id)

        # Calculate metrics
        total_value = sum(h.quantity * h.purchase_price for h in holdings)
        total_cost = sum(h.quantity * h.purchase_price for h in holdings)
        profit_loss = total_value - total_cost
        profit_loss_percent = (profit_loss / total_cost) * 100 if total_cost > 0 else 0

        # Simple Sharpe ratio calculation (risk-free rate ≈ 2% / sqrt of variance)
        # Would need historical data for proper calculation
        sharpe_ratio = profit_loss_percent / 5 if profit_loss_percent > 0 else 0

        # Simple beta calculation (would need market data for proper calculation)
        # Assume 1% monthly return as baseline
        beta = profit_loss_percent / 100

        # Annualized return (simple calculation, needs compounding)
        # Assumes 30-day period
        annualized_return = profit_loss_percent * 12

        # Max drawdown (simple version, would need historical data)
        cumulative_max = 0
        peak_value = 0
        for holding in holdings:
            peak_value = max(peak_value, total_value)
            drawdown = (peak_value - total_value) / peak_value if peak_value > 0 else 0
            cumulative_max = max(cumulative_max, drawdown)
            peak_value = total_value

        max_drawdown = cumulative_max

        return PerformanceMetrics(
            total_value=total_value,
            total_cost=total_cost,
            profit_loss=profit_loss,
            profit_loss_percent=profit_loss_percent,
            sharpe_ratio=sharpe_ratio,
            beta=beta,
            max_drawdown=max_drawdown,
            annualized_return=annualized_return
        )


portfolio_service = PortfolioService()

