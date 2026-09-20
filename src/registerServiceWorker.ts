/**
 * XCHARGE Progressive Web App Service Worker Registration
 */

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[XCharge PWA] Controller changed; reloading to activate latest version.');
        window.location.reload();
      }
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[XCharge PWA] ServiceWorker registered with scope:', registration.scope);

          // Actively check for Service Worker updates on launch
          registration.update();

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[XCharge PWA] New content installed; activating immediately.');
                  } else {
                    console.log('[XCharge PWA] Content cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.error('[XCharge PWA] ServiceWorker registration failed:', error);
        });
    });
  }
}
