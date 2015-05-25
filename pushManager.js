var debug = require('debug')('push');
var gcm = require('node-gcm');

/**
 * A user has accepted to receive push notifications
 * Subscribe him
 */
exports.subscribe = function (pushSubscription) {
    console.log('suscribed', pushSubscription);

    // TODO DB
    if (GLOBAL.pushRegistrationIds.indexOf(pushSubscription.subscriptionId) === -1) {
        GLOBAL.pushRegistrationIds.push(pushSubscription.subscriptionId);
    }
};

/**
 * Send the push notifications
 * Triggered by crontab at 9:30
 */
exports.sendPushNotifications = function () {

    // payload gets ignored anyway
    var message = new gcm.Message({});

    // Our Google Cloud Manager app key
    var sender = new gcm.Sender('AIzaSyDURRSD3bpmMjBLiTKvr4CTCXkVOsOIioU');

    debug('Sending push to all recipients:', message);

    // TODO Fill up registrationIds from select * from pushUsers
    sender.send(message, GLOBAL.pushRegistrationIds, 10, function (err, result) {
        if (err) {
            console.log('GCM error', err);
        }
        else {
            console.log('GCM result', result);
        }
    });
};
