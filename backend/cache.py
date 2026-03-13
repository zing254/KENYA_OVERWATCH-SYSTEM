"""
Kenya Overwatch Caching System
High-performance in-memory cache with TTL and LRU eviction
Supports both in-memory and Redis caching
"""

import time
import hashlib
import json
import logging
from typing import Any, Dict, Optional, Callable
from dataclasses import dataclass, field
from collections import OrderedDict

logger = logging.getLogger(__name__)


@dataclass
class CacheEntry:
    """Cache entry with TTL"""
    key: str
    value: Any
    expires_at: float
    created_at: float = field(default_factory=time.time)
    hits: int = 0


class Cache:
    """High-performance in-memory cache with LRU eviction and TTL"""
    
    def __init__(self, max_size: int = 10000, default_ttl: int = 300):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self.stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0,
            "sets": 0,
            "expired": 0,
        }
        self._lock = None
        self._redis_client = None
    
    def _generate_key(self, *args, **kwargs) -> str:
        """Generate cache key from args"""
        key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def set_redis(self, redis_client):
        """Set Redis client for distributed caching"""
        self._redis_client = redis_client
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache - checks Redis first, then local"""
        # Try Redis first if available
        if self._redis_client:
            try:
                redis_value = self._redis_client.get(key)
                if redis_value:
                    self.stats["hits"] += 1
                    return json.loads(redis_value)
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")
        
        # Fall back to local cache
        entry = self.cache.get(key)
        
        if entry is None:
            self.stats["misses"] += 1
            return None
        
        if time.time() > entry.expires_at:
            del self.cache[key]
            self.stats["misses"] += 1
            self.stats["expired"] += 1
            return None
        
        self.cache.move_to_end(key)
        entry.hits += 1
        self.stats["hits"] += 1
        
        return entry.value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache - writes to both Redis and local"""
        if ttl is None:
            ttl = self.default_ttl
        
        # Write to Redis if available
        if self._redis_client:
            try:
                self._redis_client.setex(key, ttl, json.dumps(value))
            except Exception as e:
                logger.warning(f"Redis set failed: {e}")
        
        # Always write to local cache
        if key in self.cache:
            del self.cache[key]
        
        if len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)
            self.stats["evictions"] += 1
        
        expires_at = time.time() + ttl
        self.cache[key] = CacheEntry(key=key, value=value, expires_at=expires_at)
        self.cache.move_to_end(key)
        self.stats["sets"] += 1
    
    def delete(self, key: str):
        """Delete entry from cache"""
        if self._redis_client:
            try:
                self._redis_client.delete(key)
            except Exception as e:
                logger.warning(f"Redis delete failed: {e}")
        
        if key in self.cache:
            del self.cache[key]
    
    def clear(self):
        """Clear all cache"""
        if self._redis_client:
            try:
                self._redis_client.flushdb()
            except Exception as e:
                logger.warning(f"Redis clear failed: {e}")
        
        self.cache.clear()
        self.stats = {"hits": 0, "misses": 0, "evictions": 0, "sets": 0, "expired": 0}
    
    def cleanup_expired(self, force: bool = False):
        """Remove expired entries"""
        if force or len(self.cache) > self.max_size * 0.8:
            now = time.time()
            expired_keys = [
                key for key, entry in self.cache.items()
                if now > entry.expires_at
            ]
            for key in expired_keys:
                del self.cache[key]
                self.stats["expired"] += 1
    
    def get_stats(self) -> Dict:
        """Get cache statistics"""
        total_requests = self.stats["hits"] + self.stats["misses"]
        hit_rate = (self.stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hits": self.stats["hits"],
            "misses": self.stats["misses"],
            "hit_rate": f"{hit_rate:.2f}%",
            "evictions": self.stats["evictions"],
            "sets": self.stats["sets"],
            "expired": self.stats["expired"],
            "utilization": f"{(len(self.cache) / self.max_size * 100):.1f}%" if self.max_size > 0 else "0%",
            "redis_connected": self._redis_client is not None
        }
    
    def cached(self, ttl: Optional[int] = None):
        """Decorator for caching function results"""
        def decorator(func: Callable):
            def wrapper(*args, **kwargs):
                cache_key = f"{func.__name__}:{self._generate_key(*args, **kwargs)}"
                
                result = self.get(cache_key)
                if result is not None:
                    return result
                
                result = func(*args, **kwargs)
                self.set(cache_key, result, ttl)
                return result
            return wrapper
        return decorator


# Global cache instance
cache = Cache(max_size=10000, default_ttl=300)


# Cache utilities for API responses
class ResponseCache:
    """High-performance cache for API responses"""
    
    def __init__(self, cache: Cache):
        self.cache = cache
        self._incident_keys = set()
        self._camera_keys = set()
    
    def get_incidents(self, filters: Optional[Dict] = None):
        """Get cached incidents"""
        key = f"incidents:{json.dumps(filters or {}, sort_keys=True, default=str)}"
        return self.cache.get(key)
    
    def set_incidents(self, data: Any, filters: Optional[Dict] = None, ttl: int = 30):
        """Cache incidents"""
        key = f"incidents:{json.dumps(filters or {}, sort_keys=True, default=str)}"
        self.cache.set(key, data, ttl)
        self._incident_keys.add(key)
    
    def get_cameras(self):
        """Get cached cameras"""
        return self.cache.get("cameras:all")
    
    def set_cameras(self, data: Any, ttl: int = 60):
        """Cache cameras"""
        key = "cameras:all"
        self.cache.set(key, data, ttl)
        self._camera_keys.add(key)
    
    def get_stats(self):
        """Get cached stats"""
        return self.cache.get("dashboard:stats")
    
    def set_stats(self, data: Any, ttl: int = 10):
        """Cache stats"""
        self.cache.set("dashboard:stats", data, ttl)
    
    def invalidate_incidents(self):
        """Invalidate incident caches"""
        for key in list(self._incident_keys):
            self.cache.delete(key)
        self._incident_keys.clear()
    
    def invalidate_cameras(self):
        """Invalidate camera cache"""
        self.cache.delete("cameras:all")
        if "cameras:all" in self._camera_keys:
            self._camera_keys.remove("cameras:all")
    
    def invalidate_all(self):
        """Invalidate all cached data"""
        self.cache.clear()
        self._incident_keys.clear()
        self._camera_keys.clear()


response_cache = ResponseCache(cache)