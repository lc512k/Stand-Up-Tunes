self.addEventListener('install', function (event) {
    console.log('installing...', event);
    event.waitUntil(
        caches.open('v0.9.1').then(function (cache) {

            // some less important stuff
            // cache.addAll([
            //     '/lib/fastclick.js',
            //     '/css/lato/Lato-Bold.ttf',
            //     '/css/lato/Lato-Hairline.ttf',
            //     '/css/lato/Lato-Light.ttf',
            //     '/css/lato/Lato-Regular.ttf',
            //     '/css/lato/Lato-Thin.ttf'
            // ]);

            // the core stuff - if any of this fails, install fails
            // return cache.addAll([
            //     //'/fb.js',
            //     '/client.js'
            //     // '/index.html',
            //     // '/tune-shadow.html',
            //     // '/ui.js',
            //     // '/util.js',
            //     // '/lib/webcomponents.js',
            //     // '/css/styes.css'
            // ]);
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
    console.log('fetch. caches: ', caches);
    // event.respondWith(new Response('Oops, you\'ve been service worked\n\n⌘ + ⇧ + R'));


    // event.respondWith(
    //     caches.match(event.request).then(function (response) {
    //         console.log('responding');
    //         return response || fetch(event.request);
    //     }).catch(function () {
    //         // If both fail, show a generic fallback:
    //         return caches.match('/offline.html');
    //         // However, in reality you'd have many different
    //         // fallbacks, depending on URL & headers.
    //         // Eg, a fallback silhouette image for avatars.
    //     })
    // );
});
