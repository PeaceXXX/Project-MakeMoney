#!/bin/bash
set -e

echo "Initializing Trading Platform Backend..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
PROJECT_NAME=Trading Platform
API_V1_STR=/api/v1
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trading_platform
SMTP_TLS=true
EOF
fi

# Run database migrations if alembic is configured
if [ -d "alembic" ]; then
    echo "Running database migrations..."
    alembic upgrade head
fi

echo ""
echo "Backend initialized successfully!"
echo ""
echo "To start the development server, run:"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "API documentation will be available at: http://localhost:8000/docs"
