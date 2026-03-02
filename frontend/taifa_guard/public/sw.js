// NTSA Mobile Officer - Offline Service Worker
// Provides offline functionality and background sync

const CACHE_NAME = 'ntsa-officer-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index',
  '/offline',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if offline
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and update in background
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response);
            });
          }
        });
        return cachedResponse;
      }

      // Not in cache - fetch from network
      return fetch(request).then((response) => {
        if (response.ok) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-violations') {
    event.waitUntil(syncViolations());
  }
  if (event.tag === 'sync-accidents') {
    event.waitUntil(syncAccidents());
  }
  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocation());
  }
});

async function syncViolations() {
  const db = await openDB();
  const tx = db.transaction('violations', 'readonly');
  const store = tx.objectStore('violations');
  const pending = await store.getAllPending();

  for (const violation of pending) {
    try {
      const response = await fetch('/api/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violation),
      });

      if (response.ok) {
        const tx = db.transaction('violations', 'readwrite');
        await tx.objectStore('violations').update(violation.id, { synced: true });
      }
    } catch (error) {
      console.error('Failed to sync violation:', error);
    }
  }
}

async function syncAccidents() {
  const db = await openDB();
  const tx = db.transaction('accidents', 'readonly');
  const store = tx.objectStore('accidents');
  const pending = await store.getAllPending();

  for (const accident of pending) {
    try {
      const response = await fetch('/api/accidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accident),
      });

      if (response.ok) {
        const tx = db.transaction('accidents', 'readwrite');
        await tx.objectStore('accidents').update(accident.id, { synced: true });
      }
    } catch (error) {
      console.error('Failed to sync accident:', error);
    }
  }
}

async function syncLocation() {
  const db = await openDB();
  const tx = db.transaction('location', 'readonly');
  const store = tx.objectStore('location');
  const pending = await store.getAll();

  for (const location of pending) {
    try {
      await fetch('/api/officer/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location),
      });
    } catch (error) {
      console.error('Failed to sync location:', error);
    }
  }
}

// Simple IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ntsa-officer', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  
  const options = {
    body: data.message || 'New notification from NTSA',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'NTSA Alert', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
