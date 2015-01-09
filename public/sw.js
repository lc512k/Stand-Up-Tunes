console.log('Starting SW');

self.addEventListener('install', function (event) {
    console.log('SW installed', event);
});

self.addEventListener('activate', function (event) {
    console.log('SW activated', event);
});

self.addEventListener('fetch', function (event) {
    console.log('Caught a fetch!');
    event.respondWith(new Response('Oops, you\'ve been service worked\n\n⌘ + ⇧ + R'));
});
