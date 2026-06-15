// Minimal no-op Service Worker.
// If a stale SW was previously registered (e.g. from an older PWA setup),
// shipping this file allows the browser to update it to a safe version that
// does not intercept requests (notably `/uploads/*` images).

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

