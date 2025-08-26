export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      // next-pwa will emit /sw.js in production when enabled
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered', reg);
    } catch (err) {
      console.warn('Service worker registration failed', err);
    }
  });
}
