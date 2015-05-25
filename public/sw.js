/* global importScripts, self */

importScripts('/lib/serviceworker-cache-polyfill.js');

self.addEventListener('install', function (event) {
    console.log('installing...', event);
});

self.addEventListener('activate', function (event) {
    console.log('activating...', event);
});

self.addEventListener('fetch', function (event) {
    console.log('fetch...', event);
});

self.addEventListener('push', function (/*event*/) {
    self.registration.showNotification('Mobile web stand-up at 9:40', {
        body: 'Vote for your favorite stand-up tune',
        tag: 'vote',
        icon: 'images/touch-icon-iphone-retina.png'
    });
});

self.addEventListener('notificationclick', function (event) {

    // TODO focus if window already open
    if (event.notification.tag === 'vote') {
        return self.clients.openWindow('/');
    }
});
