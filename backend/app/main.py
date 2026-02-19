"""
Main FastAPI application entry point for the Trading Platform.
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Tuple
import time
from app.core.config import settings
from app.api import auth, portfolio, trading, market_data, api_keys


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using sliding window algorithm.
    Limits API requests per IP address.
    """
    def __init__(self, app, rate_limit: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.rate_limit = rate_limit  # Max requests per window
        self.window_seconds = window_seconds  # Time window in seconds
        self.requests: Dict[str, list] = {}  # IP -> list of timestamps

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and docs
        if request.url.path in ["/", "/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Also check for X-Forwarded-For header (for reverse proxy setups)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        current_time = time.time()

        # Initialize if new client
        if client_ip not in self.requests:
            self.requests[client_ip] = []

        # Remove timestamps outside the window
        self.requests[client_ip] = [
            ts for ts in self.requests[client_ip]
            if current_time - ts < self.window_seconds
        ]

        # Check rate limit
        if len(self.requests[client_ip]) >= self.rate_limit:
            retry_after = int(self.window_seconds - (current_time - self.requests[client_ip][0]))
            return Response(
                content='{"detail":"Rate limit exceeded. Please try again later.","status_code":429}',
                status_code=429,
                media_type="application/json",
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.rate_limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(current_time + retry_after))
                }
            )

        # Add current request timestamp
        self.requests[client_ip].append(current_time)

        # Process request
        response = await call_next(request)

        # Add rate limit headers to response
        remaining = self.rate_limit - len(self.requests[client_ip])
        response.headers["X-RateLimit-Limit"] = str(self.rate_limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(current_time + self.window_seconds))

        return response

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Trading and Finance Platform API",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Add rate limiting middleware (100 requests per minute per IP)
app.add_middleware(RateLimitMiddleware, rate_limit=100, window_seconds=60)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(portfolio.router, prefix=settings.API_V1_STR)
app.include_router(trading.router, prefix=settings.API_V1_STR)
app.include_router(market_data.router, prefix=settings.API_V1_STR)
app.include_router(api_keys.router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Trading Platform API",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup."""
    from app.core.database import Base, engine
    Base.metadata.create_all(bind=engine)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
