"""
Thread-safe in-memory cache with a configurable TTL.

Usage:
    from cache import Cache
    from config import CACHE_TTL

    _cache = Cache(ttl=CACHE_TTL)

    data = _cache.get()          # None if empty or expired
    _cache.set(data)
    _cache.invalidate()
    age = _cache.age_seconds()   # seconds since last set()
"""

import threading
import time


class Cache:
    def __init__(self, ttl=None):
        self._ttl = ttl  # None means never expire
        self._data = None
        self._ts = 0.0
        self._lock = threading.Lock()

    def get(self):
        """Return cached data if present and fresh, else None."""
        with self._lock:
            if self._data is None:
                return None
            if self._ttl is not None and time.time() - self._ts >= self._ttl:
                return None
            return self._data

    def set(self, data) -> None:
        with self._lock:
            self._data = data
            self._ts = time.time()

    def invalidate(self) -> None:
        with self._lock:
            self._data = None
            self._ts = 0.0

    def age_seconds(self) -> float:
        with self._lock:
            return time.time() - self._ts if self._ts else float("inf")

    @property
    def is_fresh(self) -> bool:
        with self._lock:
            return self._data is not None and time.time() - self._ts < self._ttl
