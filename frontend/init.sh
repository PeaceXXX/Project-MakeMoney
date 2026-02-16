#!/bin/bash
set -e

echo "Initializing Trading Platform Frontend..."

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create .env.local file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
fi

echo ""
echo "Frontend initialized successfully!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "The application will be available at: http://localhost:3000"
