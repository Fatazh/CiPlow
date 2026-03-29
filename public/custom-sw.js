// public/custom-sw.js
// Custom Service Worker for Push Notifications

const PRIVATE_CACHE_NAMES = ['api-cache'];

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => PRIVATE_CACHE_NAMES.includes(name))
        .map((name) => caches.delete(name))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CLEAR_PRIVATE_CACHE') {
    return;
  }

  event.waitUntil((async () => {
    await Promise.all(PRIVATE_CACHE_NAMES.map((name) => caches.delete(name)));
  })());
});

self.addEventListener('push', (event) => {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  const data = event.data ? event.data.json() : { 
    title: 'CashPlow', 
    body: 'Ada notifikasi baru untukmu!',
    icon: '/icon-192x192.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-monochrome.png',
      data: data.url || '/',
      vibrate: [100, 50, 100]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
