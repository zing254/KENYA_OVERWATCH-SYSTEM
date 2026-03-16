class SimpleCache:
    def __init__(self):
        self._store = {}

    def get(self, key, default=None):
        return self._store.get(key, default)

    def set(self, key, value):
        self._store[key] = value

    def clear(self):
        self._store.clear()

    def get_stats(self):
        return {"size": len(self._store)}


cache = SimpleCache()
