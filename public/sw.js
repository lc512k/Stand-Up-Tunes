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

    var title = 'Mobile web stand-up at 9:40';

    var notificationBody = {
        body: 'Remember to vote for your favorite jingle!',
        tag: 'vote',
        icon: 'images/touch-icon-iphone-retina.png'
    };

    if (self.registration && self.registration.showNotification) {
        self.registration.showNotification(title, notificationBody);
    }
    else {
        // self.registration === undefined in stable
        // no notificationclick this way :(
        return new self.Notification(title, notificationBody);
    }
});

self.addEventListener('notificationclick', function (event) {

    // TODO focus if window already open
    if (event.notification.tag === 'vote') {
        return self.clients.openWindow('/');
    }
});
