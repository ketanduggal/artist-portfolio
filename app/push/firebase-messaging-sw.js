// Shows drop alerts sent from Firebase Cloud Messaging. Registered with its own scope (push/)
// so it never interferes with the app's offline worker (sw.js).
importScripts('../config.js');

// Tapping an alert opens the app (or brings it forward if it's already open).
self.addEventListener('notificationclick', event => {
  if (event.notification.data?.FCM_MSG?.fcmOptions?.link) return; // Firebase opens the message's own link
  event.notification.close();
  const appUrl = new URL('../', self.location).href;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => c.url.startsWith(appUrl));
    return open ? open.focus() : clients.openWindow(appUrl);
  }));
});

if (self.APP_CONFIG && self.APP_CONFIG.firebase) {
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
  firebase.initializeApp(self.APP_CONFIG.firebase);
  // Messages with a title and body are shown automatically while the app is closed.
  firebase.messaging();
}
