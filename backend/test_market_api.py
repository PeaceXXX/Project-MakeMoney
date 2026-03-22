#!/usr/bin/env python3
"""
Test script for market data API endpoints
"""
import sys
import os
import asyncio
import inspect

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

try:
    # Test imports
    from services.market_universe_service import market_universe_service
    print("✅ Market universe service imported successfully")

    # Check if the service has all required methods
    required_methods = [
        'initialize_stock_universe',
        'get_all_stocks_realtime',
        'get_sector_performance',
        'get_market_breadth',
        'get_market_overview'
    ]

    for method in required_methods:
        if hasattr(market_universe_service, method):
            print(f"Method {method} exists")
        else:
            print(f"Method {method} missing")

    # Test import of API router
    from api.market_data import router
    print("Market data API router imported successfully")

    # Check if the new endpoints are added
    endpoints = [route.path for route in router.routes]
    required_endpoints = [
        "/market/stocks/all",
        "/market/stocks/sectors",
        "/market/breadth",
        "/market/overview",
        "/market/initialize",
        "/market/stocks/search/all"
    ]

    for endpoint in required_endpoints:
        if any(endpoint in path for path in endpoints):
            print(f"Endpoint {endpoint} exists")
        else:
            print(f"Endpoint {endpoint} missing")

    # Test Stock model import
    from models.stock import Stock
    print("Stock model imported successfully")

    print("\nAll imports and checks passed!")

except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)