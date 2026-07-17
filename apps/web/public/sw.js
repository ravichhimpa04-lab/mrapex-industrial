self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'Apex', body: '' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (error) {
    data = { title: 'Apex', body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Apex', {
      body: data.body || '',
      icon: '/favicon.png',
      badge: '/favicon.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin/apex') && 'focus' in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow('/admin/apex');
      }

      return undefined;
    })
  );
});