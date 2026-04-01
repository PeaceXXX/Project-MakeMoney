"""
Enhanced caching layer with Redis support and in-memory fallback.

Provides caching for stock quotes, market data, and sector performance
with configurable TTL per data type.
"""

import json
import time
import logging
import threading
from typing import Any, Optional, Dict, List, Callable
from datetime import datetime, timedelta
from functools import lru_cache

logger = logging.getLogger(__name__)

# Try to import redis if available
try:
    import redis
    from redis import Redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available, using in-memory cache")


class CacheConfig:
    """Configuration for cache behavior."""
    default_ttl: int = 300  # 5 minutes
    quote_ttl: int = 60  # 1 minute for real-time quotes
    sector_ttl: int = 300  # 5 minutes
    breadth_ttl: int = 60  # 1 minute for market breadth
    market_status_ttl: int = 30  # 30 seconds

    # Redis configuration
    redis_url: Optional[str] = None
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: Optional[str] = None


class CacheStats:
    """Cache statistics."""
    hits: int = 0
    misses: int = 0
    sets: int = 0
    evictions: int = 0


class InMemoryCache:
    """Thread-safe in-memory cache with LRU eviction."""

    def __init__(self, max_size: int = 1000):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._access_order: List[str] = []  # Track access order for LRU
        self._lock = threading.RLock()
        self.max_size = max_size

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key in self._cache:
                # Update access order (move to end for LRU)
                self._access_order.remove(key)
                self._access_order.append(key)
                return self._cache[key]['value']
            return None

    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        with self._lock:
            # Evict if at capacity
            while len(self._cache) >= self.max_size:
                oldest_key = self._access_order.pop(0)
                del self._cache[oldest_key]

            # Check if key exists and update
            if key in self._cache:
                self._cache[key]['value'] = value
                self._cache[key]['expires'] = time.time() + ttl
            else:
                self._cache[key] = {'value': value, 'expires': time.time() + ttl}
                self._access_order.append(key)

    def delete(self, key: str) -> None:
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                self._access_order.remove(key)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()
            self._access_order.clear()

    def keys(self) -> List[str]:
        with self._lock:
            return list(self._cache.keys())


class CacheService:
    """
    Enhanced cache service with Redis backend and in-memory fallback.
    """

    _instance = None
    _config: CacheConfig = None
    _stats = CacheStats = None
    _redis_client: Optional[Redis] = None
    _memory_cache: Optional[InMemoryCache] = None

    def __init__(self, config: Optional[CacheConfig] = None):
        self._config = config or CacheConfig()
        self._stats = CacheStats()

        # Initialize Redis if available
        if REDIS_AVAILABLE:
            try:
                redis_url = self._config.redis_url or f"redis://{self._config.redis_host}:{self._config.redis_port}/{self._config.redis_db}"
                self._redis_client = Redis.from_url(redis_url, password=self._config.redis_password)
                logger.info("Connected to Redis cache")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                self._redis_client = None

        # Fall back to in-memory cache
        if not self._redis_client:
            self._memory_cache = InMemoryCache()
            logger.info("Using in-memory cache")

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        start_time = time.time()
        result = None

        if self._redis_client:
            try:
                value = self._redis_client.get(key)
                if value:
                    self._stats.hits += 1
                    result = json.loads(value)
                    # Check expiration
                    if isinstance(result, dict) and 'expires' in result:
                        if time.time() > result['expires']:
                            self._redis_client.delete(key)
                            return None
                    return result.get('value') if isinstance(result, dict) else result
                else:
                    self._stats.misses += 1
                    return None
            except Exception as e:
                logger.error(f"Redis get error: {e}")
                self._stats.misses += 1
                return None
        else:
            # In-memory cache
            cached = self._memory_cache.get(key)
            if cached:
                self._stats.hits += 1
                # Check expiration
                if time.time() > cached['expires']:
                    self._memory_cache.delete(key)
                    return None
                return cached['value']
            else:
                self._stats.misses += 1
                return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with TTL."""
        ttl = ttl or self._config.default_ttl
        expires = time.time() + ttl

        if self._redis_client:
            try:
                self._redis_client.setex(key, ttl, json.dumps({
                    'value': value,
                    'expires': expires,
                    'cached_at': time.time()
                }))
                self._stats.sets += 1
            except Exception as e:
                logger.error(f"Redis set error: {e}")
        else:
            # In-memory cache
            if self._memory_cache:
                self._memory_cache.set(key, value, expires)

    def delete(self, key: str) -> bool:
        """Delete value from cache."""
        if self._redis_client:
            try:
                result = self._redis_client.delete(key)
                return True
            except Exception as e:
                logger.error(f"Redis delete error: {e}")
                return False
        else:
            if self._memory_cache:
                self._memory_cache.delete(key)
                return True
            return False

    def get_stats(self) -> CacheStats:
        """Get cache statistics."""
        return self._stats

    def clear_all(self) -> bool:
        """Clear all cache entries."""
        if self._redis_client:
            try:
                self._redis_client.flushdb()
                self._stats.evictions += self._stats.hits
                self._stats = CacheStats()
                logger.info("Cleared all Redis cache")
            except Exception as e:
                logger.error(f"Redis clear error: {e}")
        else:
            if self._memory_cache:
                self._memory_cache.clear()
                self._stats = CacheStats()
                logger.info("Cleared in-memory cache")

    # Convenience methods for specific data types
    def cache_quote(self, symbol: str, quote_data: Dict[str, Any]) -> None:
        """Cache a stock quote with appropriate TTL."""
        key = f"quote:{symbol}"
        self.set(key, quote_data, self._config.quote_ttl)

    def get_cached_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get cached stock quote."""
        key = f"quote:{symbol}"
        return self.get(key)

    def cache_market_data(self, data_type: str, data: Any) -> None:
        """Cache market data with appropriate TTL."""
        ttl_map = {
            'indices': self._config.default_ttl,
            'gainers': self._config.default_ttl,
            'losers': self._config.default_ttl,
            'sectors': self._config.sector_ttl,
            'breadth': self._config.breadth_ttl,
        }
        key = f"market:{data_type}"
        self.set(key, data, ttl_map.get(data_type, self._config.default_ttl))

    def get_cached_market_data(self, data_type: str) -> Optional[Any]:
        """Get cached market data."""
        key = f"market:{data_type}"
        return self.get(key)


# Global cache service instance
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """Get or create the global cache service instance."""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service
