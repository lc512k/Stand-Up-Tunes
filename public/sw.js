/* global importScripts, Request, caches, self */

importScripts('/lib/serviceworker-cache-polyfill.js');

self.addEventListener('install', function (event) {
    console.log('installing...', event);
    event.waitUntil(
        caches.open('v0.9.3').then(function (cache) {

            // TODO cache audio and images on init and upload in client...

            // non vital stuff
            cache.addAll([
                '/tunes/mario.mp3',
                '/images/tunes/mario.mp3.png'
                ]);

            //the core stuff - if any of this fails, install fails
            var result = cache.addAll([
                '/lib/webcomponents.js',
                '/lib/fastclick.js',
                '/lib/fb/sdk.js',
                '/styles/lato/Lato-Bold.ttf',
                '/styles/lato/Lato-Hairline.ttf',
                '/styles/lato/Lato-Light.ttf',
                '/styles/lato/Lato-Regular.ttf',
                '/styles/lato/Lato-Thin.ttf',
                '/styles/style.css',
                '/client.js',
                '/fb.js',
                '/ui.js',
                '/util.js',
                '/index.html',
                '/tune-shadow.html'
                ]);

            return result;
        })
     );
});

self.addEventListener('activate', function (event) {
    console.log('activating...', event);
    // event.waitUntil(
    //     caches.keys().then(function (cacheNames) {
    //         console.log('activated');
    //         return Promise.all(
    //             cacheNames.filter(function (cacheName) {
    //                 // Return true if you want to remove this cache,
    //                 // but remember that caches are shared across
    //                 // the whole origin
    //                 // don't remove the one you're expecting, 0.9.1
    //             }).map(function (cacheName) {
    //                 //return caches.delete(cacheName);
    //             })
    //         );
    //     })
    // );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {

            var newResponse = fetch(event.request);

            if (!response) {
                console.log('no cache for ', event.request);
            }

            return response || newResponse;
        })
    );
});

// self.addEventListener('push', function (event) {
//     debugger
//     if (event.data.text() === 'new-email') {
//         event.waitUntil(
//             caches.open('mysite-dynamic').then(function (cache) {
//                 return fetch('/inbox.json').then(function (response) {
//                     cache.put('/inbox.json', response.clone());
//                     return response.json();
//                 });
//             }).then(function (emails) {
//                 registration.showNotification('New email', {
//                     body: 'From ' + emails[0].from.name,
//                     tag: 'new-email'
//                 });
//             })
//         );
//     }
// });

// self.addEventListener('notificationclick', function (event) {
//     if (event.notification.tag === 'new-email') {
//         // Assume that all of the resources needed to render
//         // /inbox/ have previously been cached, e.g. as part
//         // of the install handler.
//         new WindowClient('/inbox/');
//     }
// });
