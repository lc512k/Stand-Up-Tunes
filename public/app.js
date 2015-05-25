/* global UI, navigator, util, io, app, document, window */

var app = {

    init: function () {

        var d = new Date();
        d.setTime(d.getTime() + ONE_YEAR);

        if (document.cookie.indexOf('sut') < 0) {
            document.cookie = 'sut=' + makeid() + '; expires=' + d.toUTCString();
        }

        socket.emit('init', getCookie('sut'));

        if (window.File && window.FileReader) {
            document.getElementById('upload-button').addEventListener('click', startUpload);
            UI.fileBox.addEventListener('change', fileChosen);
            UI.nameBox.addEventListener('click', function () {
                UI.fileBox.click();
            });
        }

        // Web
        UI.registerCustomElements();

        // Service Worker
        this.registerServiceWorker();
    },

    registerServiceWorker: function () {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(this.onRegistered, this.onRegisterFailed);
        }

        // chrome://flags/#enable-experimental-web-platform-features
        navigator.serviceWorker.ready.then(this.onReady);
    },

    onRegistered: function (reg) {
        debugger
        console.log('Service worker registered! ◕‿◕', reg);
    },

    onRegisterFailed: function (err) {
        debugger
        console.log('Sevice worker failed to register ಠ_ಠ', err);
    },

    onReady: function (serviceWorkerRegistration) {
        debugger
        if (!serviceWorkerRegistration.pushManager) {
            console.warn('Push not Supported');
            return;
        }

        serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true}).then(this.onSuscribed).catch(this.onSuscribeFailed);

        //https://www.chromestatus.com/feature/5778950739460096
        //https://code.google.com/p/chromium/issues/detail?id=477401
        var servicePromise = serviceWorkerRegistration.pushManager.permissionState ?
                            serviceWorkerRegistration.pushManager.permissionState() :
                            serviceWorkerRegistration.pushManager.hasPermission();

        // Check if we have permission for push messages already
        servicePromise.then(function (pushPermissionStatus) {
debugger
            if (pushPermissionStatus !== 'granted') {
                console.log('no push permissions yet');
                return;
            }
            // We have permission,
            // so let's update the subscription
            // just to be safe
            serviceWorkerRegistration.pushManager.getSubscription().then(function (pushSubscription) {
                debugger
                // Check if we have an existing pushSubscription
                if (pushSubscription) {
                    // sendSubscription(pushSubscription);
                    // changeState(STATE_ALLOW_PUSH_SEND);
                }
                else {
                    //changeState(STATE_NOTIFICATION_PERMISSION);
                }
            });
        }).catch(function(e) {
            debugger
        });
    },

    onSuscribed: function (pushSubscription) {

        debugger
        var endpoint = pushSubscription.endpoint;
        var test = endpoint.subscriptionId;
        debugger
        socket.emit('pushSubscription', pushSubscription);
    },

    onSuscribeFailed: function (e) {

        debugger
        console.log('Unable to register for push', e);
    }
};
