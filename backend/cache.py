"""
Kenya Overwatch Caching System
In-memory cache with TTL support
"""

import time
import hashlib
import json
from typing import Any, Dict, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from collections import OrderedDict
import logging

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
    """In-memory cache with LRU eviction and TTL"""
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self.stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0,
            "sets": 0,
        }
    
    def _generate_key(self, *args, **kwargs) -> str:
        """Generate cache key from args"""
        key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        entry = self.cache.get(key)
        
        if entry is None:
            self.stats["misses"] += 1
            return None
        
        if time.time() > entry.expires_at:
            del self.cache[key]
            self.stats["misses"] += 1
            return None
        
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        entry.hits += 1
        self.stats["hits"] += 1
        
        return entry.value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache"""
        if ttl is None:
            ttl = self.default_ttl
        
        if len(self.cache) >= self.max_size:
            # Remove oldest entry
            self.cache.popitem(last=False)
            self.stats["evictions"] += 1
        
        expires_at = time.time() + ttl
        self.cache[key] = CacheEntry(key=key, value=value, expires_at=expires_at)
        self.cache.move_to_end(key)
        self.stats["sets"] += 1
    
    def delete(self, key: str):
        """Delete entry from cache"""
        if key in self.cache:
            del self.cache[key]
    
    def clear(self):
        """Clear all cache"""
        self.cache.clear()
        self.stats = {"hits": 0, "misses": 0, "evictions": 0, "sets": 0}
    
    def cleanup_expired(self):
        """Remove expired entries"""
        now = time.time()
        expired_keys = [
            key for key, entry in self.cache.items()
            if now > entry.expires_at
        ]
        for key in expired_keys:
            del self.cache[key]
    
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
cache = Cache(max_size=1000, default_ttl=300)


# Cache utilities for API responses
class ResponseCache:
    """Cache for API responses"""
    
    def __init__(self, cache: Cache):
        self.cache = cache
    
    def get_incidents(self, filters: Optional[Dict] = None):
        """Get cached incidents"""
        key = f"incidents:{json.dumps(filters or {}, sort_keys=True)}"
        return self.cache.get(key)
    
    def set_incidents(self, data: Any, filters: Optional[Dict] = None, ttl: int = 30):
        """Cache incidents"""
        key = f"incidents:{json.dumps(filters or {}, sort_keys=True)}"
        self.cache.set(key, data, ttl)
    
    def get_cameras(self):
        """Get cached cameras"""
        return self.cache.get("cameras:all")
    
    def set_cameras(self, data: Any, ttl: int = 60):
        """Cache cameras"""
        self.cache.set("cameras:all", data, ttl)
    
    def get_stats(self):
        """Get cached stats"""
        return self.cache.get("dashboard:stats")
    
    def set_stats(self, data: Any, ttl: int = 10):
        """Cache stats"""
        self.cache.set("dashboard:stats", data, ttl)
    
    def invalidate_incidents(self):
        """Invalidate incident cache"""
        for key in list(self.cache.cache.keys()):
            if key.startswith("incidents:"):
                self.cache.delete(key)
    
    def invalidate_cameras(self):
        """Invalidate camera cache"""
        self.cache.delete("cameras:all")


response_cache = ResponseCache(cache)
