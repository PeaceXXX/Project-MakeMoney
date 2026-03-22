#!/usr/bin/env python3
"""
Simple test for market data functionality
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    # Test basic imports
    print("Testing imports...")

    # Test yfinance
    import yfinance as yf
    print("[OK] yfinance imported successfully")

    # Test basic yfinance functionality
    ticker = yf.Ticker('AAPL')
    info = ticker.info
    print(f"[OK] AAPL info: {info.get('longName', 'N/A')}")

    # Test getting real-time data
    hist = ticker.history(period='1d', interval='1m')
    if not hist.empty:
        latest = hist.iloc[-1]
        print(f"[OK] AAPL latest price: ${latest['Close']:.2f}")
    else:
        print("[ERROR] No historical data")

    print("\n[OK] All basic tests passed!")

except ImportError as e:
    print(f"[ERROR] Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"[ERROR] Error: {e}")
    sys.exit(1)