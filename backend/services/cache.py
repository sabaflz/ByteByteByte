"""Small thread-safe TTL cache.

Flask serves requests on several threads, so reads and writes take a lock.
Entries expire on read; there's no background sweeper because the key space
is small (one entry per rounded location per data source).
"""

import threading
import time
from typing import Any, Callable, Hashable


class TTLCache:
	def __init__(self, ttl_seconds: float, max_entries: int = 1024, clock: Callable[[], float] = time.monotonic):
		self.ttl = ttl_seconds
		self.max_entries = max_entries
		self._clock = clock
		self._data: dict[Hashable, tuple[float, Any]] = {}
		self._lock = threading.Lock()

	def get(self, key: Hashable) -> Any | None:
		with self._lock:
			entry = self._data.get(key)
			if entry is None:
				return None
			expires_at, value = entry
			if self._clock() >= expires_at:
				del self._data[key]
				return None
			return value

	def set(self, key: Hashable, value: Any) -> None:
		with self._lock:
			if len(self._data) >= self.max_entries and key not in self._data:
				# Drop the entry closest to expiring to make room.
				oldest = min(self._data, key=lambda k: self._data[k][0])
				del self._data[oldest]
			self._data[key] = (self._clock() + self.ttl, value)

	def clear(self) -> None:
		with self._lock:
			self._data.clear()


def location_key(lat: float, lon: float) -> tuple[float, float]:
	"""Round to 2 decimals (~1 km) so nearby requests share a cache entry."""
	return (round(lat, 2), round(lon, 2))
