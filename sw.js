/* ============================================
   📦 SERVICE WORKER - PWA LINKTREE
   ============================================
   
   Ce fichier permet à l'application de fonctionner
   hors ligne en mettant en cache les ressources.
   
   🔧 CONFIGURATION :
   - CACHE_NAME : Nom du cache (incrémente la version pour forcer une mise à jour)
   - URLS_TO_CACHE : Liste des fichiers à mettre en cache
   
   ============================================ */

// Nom du cache - INCRÉMENTE LE NUMÉRO POUR FORCER UNE MISE À JOUR
const CACHE_NAME = 'restaurant-linktree-v1';

// Fichiers à mettre en cache pour le mode offline
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/icons/icon-192.svg',
    '/assets/icons/icon-512.svg',
];

// URLs externes à mettre en cache (Google Fonts)
const EXTERNAL_URLS = [
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
];

/* ============================================
   📥 INSTALLATION DU SERVICE WORKER
   ============================================ */
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installation en cours...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Mise en cache des fichiers');
                return cache.addAll(URLS_TO_CACHE);
            })
            .then(() => {
                // Force l'activation immédiate du nouveau SW
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Erreur de mise en cache:', error);
            })
    );
});

/* ============================================
   🔄 ACTIVATION DU SERVICE WORKER
   ============================================ */
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activé');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            // Supprime les anciennes versions du cache
                            return cacheName !== CACHE_NAME;
                        })
                        .map((cacheName) => {
                            console.log('🗑️ Suppression ancien cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                // Prend le contrôle immédiat de toutes les pages
                return self.clients.claim();
            })
    );
});

/* ============================================
   🌐 INTERCEPTION DES REQUÊTES
   ============================================ */
self.addEventListener('fetch', (event) => {
    // Ignore les requêtes non-GET
    if (event.request.method !== 'GET') {
        return;
    }

    // Ignore les requêtes chrome-extension et autres
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        // Stratégie: Network First, Fallback to Cache
        fetch(event.request)
            .then((networkResponse) => {
                // Clone la réponse car elle ne peut être utilisée qu'une fois
                const responseToCache = networkResponse.clone();
                
                // Met à jour le cache avec la nouvelle réponse
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        // Ne cache que les réponses réussies
                        if (networkResponse.status === 200) {
                            cache.put(event.request, responseToCache);
                        }
                    });
                
                return networkResponse;
            })
            .catch(() => {
                // Si le réseau échoue, utilise le cache
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // Si la ressource n'est pas en cache, retourne la page principale
                        // (utile pour les navigations SPA)
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // Sinon, retourne une erreur 404
                        return new Response('Ressource non disponible hors ligne', {
                            status: 404,
                            statusText: 'Not Found'
                        });
                    });
            })
    );
});

/* ============================================
   📢 NOTIFICATION DE MISE À JOUR
   ============================================ */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

/* ============================================
   🔔 PUSH NOTIFICATIONS (optionnel)
   ============================================ */
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'Nouvelle notification',
        icon: '/assets/icons/icon-192.svg',
        badge: '/assets/icons/icon-192.svg',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Mon Restaurant', options)
    );
});

// Gestion du clic sur les notifications
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});

