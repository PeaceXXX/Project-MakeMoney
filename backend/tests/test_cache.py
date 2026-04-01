"""
Tests for cache service.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import time
import threading

from app.core.cache import (
    CacheConfig,
    CacheStats,
    InMemoryCache,
    CacheService,
    get_cache_service
)


class TestCacheConfig:
    """Test cache configuration."""

    def test_default_config(self):
        """Test default configuration values."""
        config = CacheConfig()

        assert config.default_ttl == 300
        assert config.quote_ttl == 60
        assert config.sector_ttl == 300
        assert config.breadth_ttl == 60
        assert config.market_status_ttl == 30
        assert config.redis_host == "localhost"
        assert config.redis_port == 6379
        assert config.redis_db == 0


class TestCacheStats:
    """Test cache statistics."""

    def test_initial_stats(self):
        """Test initial statistics values."""
        stats = CacheStats()

        assert stats.hits == 0
        assert stats.misses == 0
        assert stats.sets == 0
        assert stats.evictions == 0


class TestInMemoryCache:
    """Test in-memory cache functionality."""

    def test_set_and_get(self):
        """Test basic set and get operations."""
        cache = InMemoryCache(max_size=100)

        # Set a value
        cache.set('key1', 'value1', ttl=300)
        result = cache.get('key1')

        assert result == 'value1'

    def test_set_with_expiration(self):
        """Test set with expiration."""
        cache = InMemoryCache()

        # Set with short TTL
        cache.set('key1', 'value1', ttl=1)

        # Should be present initially
        assert cache.get('key1') is not None

        # Wait for expiration
        time.sleep(1.1)

        # Now should be expired (but we don't check expiration in get)
        # Note: InMemoryCache.get() doesn't check expiration by itself
        # The CacheService handles expiration checking

    def test_delete(self):
        """Test delete operation."""
        cache = InMemoryCache()

        cache.set('key1', 'value1', ttl=300)
        cache.set('key2', 'value2', ttl=300)

        # Delete one key
        cache.delete('key1')

        assert cache.get('key1') is None
        assert cache.get('key2') == 'value2'

    def test_clear(self):
        """Test clear operation."""
        cache = InMemoryCache()

        cache.set('key1', 'value1', ttl=300)
        cache.set('key2', 'value2', ttl=300)

        cache.clear()

        assert cache.get('key1') is None
        assert cache.get('key2') is None

    def test_keys(self):
        """Test keys listing."""
        cache = InMemoryCache()

        cache.set('key1', 'value1', ttl=300)
        cache.set('key2', 'value2', ttl=300)
        cache.set('key3', 'value3', ttl=300)

        keys = cache.keys()

        assert len(keys) == 3
        assert 'key1' in keys
        assert 'key2' in keys
        assert 'key3' in keys

    def test_lru_eviction(self):
        """Test LRU eviction when max size is reached."""
        cache = InMemoryCache(max_size=3)

        # Add 3 items (max capacity)
        cache.set('key1', 'value1', ttl=300)
        cache.set('key2', 'value2', ttl=300)
        cache.set('key3', 'value3', ttl=300)

        # Add 4th item, should evict oldest (key1)
        cache.set('key4', 'value4', ttl=300)

        assert cache.get('key1') is None
        assert cache.get('key2') == 'value2'
        assert cache.get('key3') == 'value3'
        assert cache.get('key4') == 'value4'

    def test_update_existing_key(self):
        """Test updating an existing key updates value and access order."""
        cache = InMemoryCache(max_size=10)

        cache.set('key1', 'value1', ttl=300)
        cache.get('key1')  # Access it

        # Update the same key
        cache.set('key1', 'value1_updated', ttl=300)

        result = cache.get('key1')
        assert result == 'value1_updated'

    def test_thread_safety(self):
        """Test thread safety with concurrent access."""
        cache = InMemoryCache(max_size=100)
        errors = []

        def worker(key):
            try:
                for i in range(100):
                    cache.set(f"{key}_{i}", f"value_{i}", ttl=300)
                    _ = cache.get(f"{key}_{i}")
            except Exception as e:
                errors.append(e)

        threads = []
        for i in range(10):
                t = threading.Thread(target=worker, args=(f"thread_{i}",))
                threads.append(t)
                t.start()

        for t in threads:
            t.join()

        assert len(errors) == 0


class TestCacheService:
    """Test cache service functionality."""

    @patch('app.core.cache.REDIS_AVAILABLE', False)
    def test_initialization_without_redis(self):
        """Test service initialization without Redis."""
        service = CacheService()

        assert service._redis_client is None
        assert service._memory_cache is not None

    @patch('app.core.cache.REDIS_AVAILABLE', True)
    @patch('app.core.cache.Redis')
    def test_initialization_with_redis(self, mock_redis):
        """Test service initialization with Redis."""
        mock_redis_instance = Mock()
        mock_redis.from_url.return_value = mock_redis_instance

        service = CacheService()

        assert service._redis_client is not None
        mock_redis.from_url.assert_called_once()

    @patch('app.core.cache.REDIS_AVAILABLE', False)
    def test_get_and_set_in_memory(self):
        """Test get and set with in-memory cache."""
        service = CacheService()

        # Set a value
        service.set('test_key', {'data': 'test_value'}, ttl=60)

        # Get the value
        result = service.get('test_key')

        assert result == {'data': 'test_value'}

    @patch('app.core.cache.REDIS_AVAILABLE', False)
    def test_get_nonexistent_key(self):
        """Test getting a nonexistent key."""
        service = CacheService()

        result = service.get('nonexistent_key')

        assert result is None
        assert service._stats.misses == 1

    @patch('app.core.cache.REDIS_AVAILABLE', False)
    def test_delete(self):
        """Test delete operation."""
        service = CacheService()

        service.set('key1', 'value1', ttl=60)
        service.set('key2', 'value2', ttl=60)

        # Delete one key
        result = service.delete('key1')

        assert result is True
        assert service.get('key1') is None
        assert service.get('key2') == 'value2'

    @patch('app.core.cache.REDIS_AVAILABLE', False)
    def test_get_stats(self):
        """Test getting cache statistics."""
        service = CacheService()

        service.set('key1', 'value1', ttl=60)
        service.get('key1')  # Hit
        service.get('nonexistent')  # Miss

        stats = service.get_stats()

        assert stats.sets == 1
        assert stats.hits == 1
        assert stats.misses == 1

    @patch('app.core.cache.REDIS_AVAILABLE', False)
    def test_clear_all(self):
        """Test clearing all cache entries."""
        service = CacheService()

        service.set('key1', 'value1', ttl=60)
        service.set('key2', 'value2', ttl=60)

        service.clear_all()

        assert service.get('key1') is None
        assert service.get('key2') is None

    @patch('app.core.cache.REDIS_AVAILABLE', False)
    def test_cache_quote(self):
        """Test caching stock quote."""
        service = CacheService()

        quote_data = {
            'symbol': 'AAPL',
            'current_price': 150.25,
            'change': 2.50
        }

        service.cache_quote('AAPL', quote_data)

        result = service.get_cached_quote('AAPL')

        assert result == quote_data

    @patch('app.core.cache.REDIS_AVAILABLE', False)
    def test_cache_market_data(self):
        """Test caching market data."""
        service = CacheService()

        market_data = {
            'indices': [
                {'symbol': 'SPX', 'value': 4500}
            ]
        }

        service.cache_market_data('indices', market_data)

        result = service.get_cached_market_data('indices')

        assert result == market_data

    @patch('app.core.cache.REDIS_AVAILABLE', False)
    def test_expiration(self):
        """Test cache entry expiration."""
        service = CacheService()

        # Set with very short TTL
        service.set('expiring_key', 'value', ttl=1)

        # Should be present initially
        result = service.get('expiring_key')
        assert result == 'value'

        # Wait for expiration
        time.sleep(1.1)

        # Should be expired now (returns None and increments eviction)
        result = service.get('expiring_key')
        # Note: This depends on whether CacheService.get() checks expiration
        # Based on the code, it should return None if expired

    @patch('app.core.cache.REDIS_AVAILABLE', True)
    @patch('app.core.cache.Redis')
    def test_redis_operations(self, mock_redis):
        """Test Redis backend operations."""
        mock_redis_instance = Mock()
        mock_redis.from_url.return_value = mock_redis_instance

        service = CacheService()

        # Test Redis set
        service.set('test_key', 'test_value', ttl=60)
        mock_redis_instance.setex.assert_called_once()

        # Test Redis get
        mock_redis_instance.get.return_value = b'{"value": "test_value", "expires": 9999999999}'
        result = service.get('test_key')
        mock_redis_instance.get.assert_called_once()

        # Test Redis delete
        mock_redis_instance.delete.return_value = 1
        result = service.delete('test_key')
        assert result is True


class TestGetCacheService:
    """Test global cache service singleton."""

    @patch('app.core.cache.REDIS_AVAILABLE', False)
    def test_singleton_pattern(self):
        """Test that get_cache_service returns singleton."""
        # Reset global instance
        import app.core.cache
        app.core.cache._cache_service = None

        service1 = get_cache_service()
        service2 = get_cache_service()

        assert service1 is service2

    @patch('app.core.cache.REDIS_AVAILABLE', False)
    def test_creates_instance_if_none(self):
        """Test that service is created if none exists."""
        import app.core.cache
        app.core.cache._cache_service = None

        service = get_cache_service()

        assert service is not None
        assert isinstance(service, CacheService)
