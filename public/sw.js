// Service Worker para suporte a PWA instalável no Galaxy S23
const CACHE_NAME = 'jarvis-pwa-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Para rotas da API REST, sempre vai para a rede direta
    if (event.request.url.includes('/api/')) {
        return;
    }
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
