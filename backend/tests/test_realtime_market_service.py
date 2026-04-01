"""
Tests for realtime market data service.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, time
import pytz

from app.services.realtime_market_service import (
    is_market_open,
    get_realtime_quote,
    get_multiple_quotes,
    get_market_indices_realtime,
    get_historical_data_yahoo,
    search_stocks_yahoo
)


class TestIsMarketOpen:
    """Test market open status checking."""

    @patch('app.services.realtime_market_service.datetime')
    def test_market_open_weekday_morning(self, mock_datetime):
        """Test market is open on weekday morning at 10am ET."""
        # Mock a Tuesday at 10:00 AM ET
        eastern = pytz.timezone('US/Eastern')
        mock_now = eastern.localize(datetime(2024, 1, 16, 10, 0, 0))  # Tuesday 10:00 AM
        mock_datetime.now.return_value = mock_now

        result = is_market_open()
        assert result is True

    @patch('app.services.realtime_market_service.datetime')
    def test_market_open_weekday_afternoon(self, mock_datetime):
        """Test market is open on weekday afternoon at 2pm ET."""
        eastern = pytz.timezone('US/Eastern')
        mock_now = eastern.localize(datetime(2024, 1, 16, 14, 0, 0))  # Tuesday 2:00 PM
        mock_datetime.now.return_value = mock_now

        result = is_market_open()
        assert result is True

    @patch('app.services.realtime_market_service.datetime')
    def test_market_closed_weekday_before_open(self, mock_datetime):
        """Test market is closed before 9:30 AM ET."""
        eastern = pytz.timezone('US/Eastern')
        mock_now = eastern.localize(datetime(2024, 1, 16, 8, 0, 0))  # Tuesday 8:00 AM
        mock_datetime.now.return_value = mock_now

        result = is_market_open()
        assert result is False

    @patch('app.services.realtime_market_service.datetime')
    def test_market_closed_weekday_after_close(self, mock_datetime):
        """Test market is closed after 4:00 PM ET."""
        eastern = pytz.timezone('US/Eastern')
        mock_now = eastern.localize(datetime(2024, 1, 16, 17, 0, 0))  # Tuesday 5:00 PM
        mock_datetime.now.return_value = mock_now

        result = is_market_open()
        assert result is False

    @patch('app.services.realtime_market_service.datetime')
    def test_market_closed_saturday(self, mock_datetime):
        """Test market is closed on Saturday."""
        eastern = pytz.timezone('US/Eastern')
        mock_now = eastern.localize(datetime(2024, 1, 20, 10, 0, 0))  # Saturday 10:00 AM
        mock_datetime.now.return_value = mock_now

        result = is_market_open()
        assert result is False

    @patch('app.services.realtime_market_service.datetime')
    def test_market_closed_sunday(self, mock_datetime):
        """Test market is closed on Sunday."""
        eastern = pytz.timezone('US/Eastern')
        mock_now = eastern.localize(datetime(2024, 1, 21, 14, 0, 0))  # Sunday 2:00 PM
        mock_datetime.now.return_value = mock_now

        result = is_market_open()
        assert result is False

    @patch('app.services.realtime_market_service.datetime')
    def test_market_exactly_at_open(self, mock_datetime):
        """Test market is open exactly at 9:30 AM ET."""
        eastern = pytz.timezone('US/Eastern')
        mock_now = eastern.localize(datetime(2024, 1, 16, 9, 30, 0))  # Tuesday 9:30 AM
        mock_datetime.now.return_value = mock_now

        result = is_market_open()
        assert result is True

    @patch('app.services.realtime_market_service.datetime')
    def test_market_exactly_at_close(self, mock_datetime):
        """Test market is open exactly at 4:00 PM ET."""
        eastern = pytz.timezone('US/Eastern')
        mock_now = eastern.localize(datetime(2024, 1, 16, 16, 0, 0))  # Tuesday 4:00 PM
        mock_datetime.now.return_value = mock_now

        result = is_market_open()
        assert result is True


class TestGetRealtimeQuote:
    """Test real-time quote fetching."""

    @patch('app.services.realtime_market_service.yf.Ticker')
    @patch('app.services.realtime_market_service.is_market_open')
    def test_get_realtime_quote_success(self, mock_is_market_open, mock_ticker):
        """Test successful quote retrieval."""
        mock_is_market_open.return_value = True

        # Mock ticker info
        mock_info = {
            'currentPrice': 150.25,
            'previousClose': 148.50,
            'longName': 'Apple Inc.',
            'regularMarketOpen': 149.00,
            'dayHigh': 151.00,
            'dayLow': 149.50,
            'volume': 50000000,
            'averageVolume': 45000000,
            'marketCap': 2500000000000,
            'trailingPE': 28.5,
            'dividendYield': 0.005,
            'fiftyTwoWeekHigh': 199.62,
            'fiftyTwoWeekLow': 124.17
        }

        mock_ticker_instance = Mock()
        mock_ticker_instance.info = mock_info
        mock_ticker.return_value = mock_ticker_instance

        result = get_realtime_quote('AAPL')

        assert result is not None
        assert result['symbol'] == 'AAPL'
        assert result['name'] == 'Apple Inc.'
        assert result['current_price'] == 150.25
        assert result['previous_close'] == 148.50
        assert result['change'] == 1.75
        assert result['change_percent'] == pytest.approx(1.18, 0.01)
        assert result['is_market_open'] is True
        assert 'last_updated' in result

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_get_realtime_quote_no_info(self, mock_ticker):
        """Test quote retrieval when no info is returned."""
        mock_ticker_instance = Mock()
        mock_ticker_instance.info = None
        mock_ticker.return_value = mock_ticker_instance

        result = get_realtime_quote('INVALID')

        assert result is None

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_get_realtime_quote_no_price(self, mock_ticker):
        """Test quote retrieval when price is not available."""
        mock_ticker_instance = Mock()
        mock_ticker_instance.info = {'longName': 'Test Stock'}
        mock_ticker.return_value = mock_ticker_instance

        result = get_realtime_quote('TEST')

        assert result is None

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_get_realtime_quote_exception(self, mock_ticker):
        """Test quote retrieval handles exceptions."""
        mock_ticker.side_effect = Exception("API Error")

        result = get_realtime_quote('AAPL')

        assert result is None

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_get_realtime_quote_fallback_to_regular_market_price(self, mock_ticker):
        """Test quote falls back to regularMarketPrice if currentPrice is missing."""
        mock_info = {
            'regularMarketPrice': 145.00,
            'previousClose': 144.00,
            'shortName': 'Test Stock'
        }

        mock_ticker_instance = Mock()
        mock_ticker_instance.info = mock_info
        mock_ticker.return_value = mock_ticker_instance

        result = get_realtime_quote('TEST')

        assert result is not None
        assert result['current_price'] == 145.00

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_get_realtime_quote_fallback_to_previous_close(self, mock_ticker):
        """Test quote falls back to previousClose if no current price available."""
        mock_info = {
            'previousClose': 144.00,
            'shortName': 'Test Stock'
        }

        mock_ticker_instance = Mock()
        mock_ticker_instance.info = mock_info
        mock_ticker.return_value = mock_ticker_instance

        result = get_realtime_quote('TEST')

        assert result is not None
        assert result['current_price'] == 144.00
        assert result['change'] == 0.0
        assert result['change_percent'] == 0.0

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_get_realtime_quote_symbol_case_insensitive(self, mock_ticker):
        """Test quote retrieval is case-insensitive."""
        mock_info = {
            'currentPrice': 150.25,
            'previousClose': 148.50,
            'shortName': 'Apple Inc.'
        }

        mock_ticker_instance = Mock()
        mock_ticker_instance.info = mock_info
        mock_ticker.return_value = mock_ticker_instance

        result = get_realtime_quote('aapl')

        assert result is not None
        assert result['symbol'] == 'AAPL'
        mock_ticker.assert_called_once_with('AAPL')


class TestGetMultipleQuotes:
    """Test fetching multiple quotes."""

    @patch('app.services.realtime_market_service.get_realtime_quote')
    def test_get_multiple_quotes_success(self, mock_get_quote):
        """Test fetching multiple quotes successfully."""
        mock_get_quote.side_effect = [
            {'symbol': 'AAPL', 'current_price': 150.00},
            {'symbol': 'MSFT', 'current_price': 300.00},
            {'symbol': 'GOOGL', 'current_price': 2500.00}
        ]

        result = get_multiple_quotes(['aapl', 'msft', 'googl'])

        assert len(result) == 3
        assert result['AAPL']['current_price'] == 150.00
        assert result['MSFT']['current_price'] == 300.00
        assert result['GOOGL']['current_price'] == 2500.00

    @patch('app.services.realtime_market_service.get_realtime_quote')
    def test_get_multiple_quotes_with_failures(self, mock_get_quote):
        """Test fetching multiple quotes with some failures."""
        mock_get_quote.side_effect = [
            {'symbol': 'AAPL', 'current_price': 150.00},
            None,  # Failed quote
            {'symbol': 'GOOGL', 'current_price': 2500.00}
        ]

        result = get_multiple_quotes(['aapl', 'invalid', 'googl'])

        assert len(result) == 2
        assert 'AAPL' in result
        assert 'GOOGL' in result
        assert 'INVALID' not in result

    @patch('app.services.realtime_market_service.get_realtime_quote')
    def test_get_multiple_quotes_empty_list(self, mock_get_quote):
        """Test fetching quotes with empty list."""
        result = get_multiple_quotes([])

        assert result == {}
        mock_get_quote.assert_not_called()


class TestGetMarketIndicesRealtime:
    """Test market indices fetching."""

    @patch('app.services.realtime_market_service.get_realtime_quote')
    def test_get_market_indices_success(self, mock_get_quote):
        """Test fetching market indices successfully."""
        mock_get_quote.side_effect = [
            {
                'current_price': 4500.00,
                'change': 25.00,
                'change_percent': 0.56,
                'is_market_open': True,
                'last_updated': '2024-01-16T14:30:00'
            },
            {
                'current_price': 15000.00,
                'change': 100.00,
                'change_percent': 0.67,
                'is_market_open': True,
                'last_updated': '2024-01-16T14:30:00'
            },
            {
                'current_price': 35000.00,
                'change': 200.00,
                'change_percent': 0.57,
                'is_market_open': True,
                'last_updated': '2024-01-16T14:30:00'
            }
        ]

        result = get_market_indices_realtime()

        assert len(result) == 3
        assert result[0]['symbol'] == 'SPX'
        assert result[0]['name'] == 'S&P 500'
        assert result[1]['symbol'] == 'NDX'
        assert result[2]['symbol'] == 'DJI'

    @patch('app.services.realtime_market_service.get_realtime_quote')
    def test_get_market_indices_with_failures(self, mock_get_quote):
        """Test fetching indices with some failures."""
        mock_get_quote.side_effect = [
            {
                'current_price': 4500.00,
                'change': 25.00,
                'change_percent': 0.56,
                'is_market_open': True,
                'last_updated': '2024-01-16T14:30:00'
            },
            None,  # Failed
            {
                'current_price': 35000.00,
                'change': 200.00,
                'change_percent': 0.57,
                'is_market_open': True,
                'last_updated': '2024-01-16T14:30:00'
            }
        ]

        result = get_market_indices_realtime()

        assert len(result) == 2
        assert result[0]['symbol'] == 'SPX'
        assert result[1]['symbol'] == 'DJI'


class TestGetHistoricalDataYahoo:
    """Test historical data fetching."""

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_get_historical_data_success(self, mock_ticker):
        """Test fetching historical data successfully."""
        import pandas as pd
        from datetime import datetime

        # Create mock historical data
        dates = pd.date_range(start='2024-01-01', periods=5, freq='D')
        mock_hist = pd.DataFrame({
            'Open': [100.0, 101.0, 102.0, 103.0, 104.0],
            'High': [105.0, 106.0, 107.0, 108.0, 109.0],
            'Low': [95.0, 96.0, 97.0, 98.0, 99.0],
            'Close': [102.0, 103.0, 104.0, 105.0, 106.0],
            'Volume': [1000000, 1100000, 1200000, 1300000, 1400000]
        }, index=dates)

        mock_ticker_instance = Mock()
        mock_ticker_instance.history.return_value = mock_hist
        mock_ticker.return_value = mock_ticker_instance

        result = get_historical_data_yahoo('AAPL', period='5d', interval='1d')

        assert len(result) == 5
        assert result[0]['open'] == 100.0
        assert result[0]['close'] == 102.0
        assert result[0]['volume'] == 1000000
        assert 'timestamp' in result[0]

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_get_historical_data_empty(self, mock_ticker):
        """Test fetching historical data when empty."""
        import pandas as pd

        mock_ticker_instance = Mock()
        mock_ticker_instance.history.return_value = pd.DataFrame()
        mock_ticker.return_value = mock_ticker_instance

        result = get_historical_data_yahoo('INVALID', period='1mo', interval='1d')

        assert result == []

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_get_historical_data_exception(self, mock_ticker):
        """Test fetching historical data handles exceptions."""
        mock_ticker.side_effect = Exception("API Error")

        result = get_historical_data_yahoo('AAPL', period='1mo', interval='1d')

        assert result == []

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_get_historical_data_different_periods(self, mock_ticker):
        """Test fetching historical data with different periods."""
        import pandas as pd

        mock_hist = pd.DataFrame({
            'Open': [100.0],
            'High': [105.0],
            'Low': [95.0],
            'Close': [102.0],
            'Volume': [1000000]
        }, index=pd.date_range(start='2024-01-01', periods=1, freq='D'))

        mock_ticker_instance = Mock()
        mock_ticker_instance.history.return_value = mock_hist
        mock_ticker.return_value = mock_ticker_instance

        # Test different period/interval combinations
        for period in ['1d', '5d', '1mo', '3mo', '1y']:
            for interval in ['1d', '1h', '1wk']:
                result = get_historical_data_yahoo('AAPL', period=period, interval=interval)
                assert isinstance(result, list)
                mock_ticker_instance.history.assert_called_with(period=period, interval=interval)


class TestSearchStocksYahoo:
    """Test stock search functionality."""

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_search_stocks_success(self, mock_ticker):
        """Test searching stocks successfully."""
        mock_info = {
            'shortName': 'Apple Inc.',
            'longName': 'Apple Inc.',
            'exchange': 'NASDAQ',
            'quoteType': 'EQUITY'
        }

        mock_ticker_instance = Mock()
        mock_ticker_instance.info = mock_info
        mock_ticker.return_value = mock_ticker_instance

        result = search_stocks_yahoo('AAPL', limit=5)

        assert len(result) > 0
        assert result[0]['symbol'] == 'AAPL'
        assert result[0]['name'] == 'Apple Inc.'
        assert result[0]['exchange'] == 'NASDAQ'

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_search_stocks_no_results(self, mock_ticker):
        """Test searching stocks with no results."""
        mock_ticker_instance = Mock()
        mock_ticker_instance.info = {}
        mock_ticker.return_value = mock_ticker_instance

        result = search_stocks_yahoo('INVALID', limit=5)

        assert result == []

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_search_stocks_exception(self, mock_ticker):
        """Test searching stocks handles exceptions."""
        mock_ticker.side_effect = Exception("API Error")

        result = search_stocks_yahoo('AAPL', limit=5)

        assert result == []

    @patch('app.services.realtime_market_service.yf.Ticker')
    def test_search_stocks_respects_limit(self, mock_ticker):
        """Test search respects limit parameter."""
        mock_info = {
            'shortName': 'Test Stock',
            'exchange': 'NASDAQ',
            'quoteType': 'EQUITY'
        }

        mock_ticker_instance = Mock()
        mock_ticker_instance.info = mock_info
        mock_ticker.return_value = mock_ticker_instance

        result = search_stocks_yahoo('TEST', limit=1)

        # Should only try 1 symbol due to limit
        assert mock_ticker.call_count <= 2  # Tries original and .US suffix
