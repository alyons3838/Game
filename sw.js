/**
 * Service Worker for PWA functionality
 */

const CACHE_NAME = 'long-road-home-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/src/config/gameConfig.js',
    '/src/utils/SaveManager.js',
    '/src/utils/DialogueManager.js',
    '/src/data/GameData.js',
    '/src/models/Character.js',
    '/src/models/Companion.js',
    '/src/models/Stats.js',
    '/src/models/Perk.js',
    '/src/services/AIService.js',
    '/src/scenes/BootScene.js',
    '/src/scenes/MainMenuScene.js',
    '/src/scenes/CharacterCreationScene.js',
    '/src/scenes/GameScene.js',
    '/src/scenes/DialogueScene.js',
    '/src/scenes/MapScene.js',
    '/src/scenes/StatsScene.js',
    '/src/main.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
