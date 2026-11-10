/**
 * ChargeLink GH Progressive Web App — Service Worker Registration
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // In local development, unregister any existing service worker and purge caches
  // so HMR and hot module updates are never intercepted or served stale.
  const isDev = Boolean(
    (import.meta as any).env?.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '5173'
  );

  if (isDev) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
    return;
  }

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('[ChargeLink PWA] Controller changed; reloading to activate latest version.');
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[ChargeLink PWA] ServiceWorker registered with scope:', registration.scope);

        // Actively check for Service Worker updates on launch
        registration.update();

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[ChargeLink PWA] New content installed; activating immediately.');
                } else {
                  console.log('[ChargeLink PWA] Content cached for offline use.');
                }
              }
            };
          }
        };
      })
      .catch((error) => {
        console.error('[ChargeLink PWA] ServiceWorker registration failed:', error);
      });
  });
}
