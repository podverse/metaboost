/* eslint-disable no-undef — service worker global scope */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch {
    payload = {};
  }
  const bucketIdText = typeof payload.bucketIdText === 'string' ? payload.bucketIdText : '';
  const title = 'MetaBoost';
  const body = bucketIdText !== '' ? 'New boost in bucket ' + bucketIdText : 'New bucket message';
  const relativeUrl =
    bucketIdText !== ''
      ? '/bucket/' + encodeURIComponent(bucketIdText) + '?tab=messages'
      : '/dashboard';
  const url = new URL(relativeUrl, self.location.origin).href;
  const tag =
    payload.messageGuid !== undefined && payload.messageGuid !== null
      ? String(payload.messageGuid)
      : 'metaboost-push';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      tag,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl =
    event.notification.data !== undefined &&
    event.notification.data !== null &&
    typeof event.notification.data.url === 'string'
      ? event.notification.data.url
      : null;
  if (targetUrl === null || targetUrl === '') {
    return;
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i += 1) {
        const client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow !== undefined) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
