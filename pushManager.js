var debug = require('debug')('push');
var gcm = require('node-gcm');

/**
 * A user has accepted to receive push notifications
 * Subscribe him
 */
exports.subscribe = function (pushSubscription) {
    debug(pushSubscription);

    // TODO Save pushSubscription.subscriptionId to DBs
    GLOBAL.pushRegistrationIds.push(pushSubscription.subscriptionId);
};

/**
 * Send the push notifications
 * Triggered by cron.js at 9:30
 */
exports.sendPushNotifications = function () {

    // TODO give message real contents
    // figure out why chrome don't see them
    var message = new gcm.Message({
        collapseKey: 'demo',
        delayWhileIdle: true,
        timeToLive: 3,
        data: {
            key1: 'message1',
            key2: 'message2'
        }
    });

    // Our Google Cloud Manager app key
    var sender = new gcm.Sender('AIzaSyDURRSD3bpmMjBLiTKvr4CTCXkVOsOIioU');

    debug('Sending message to all recipients:', message);

    // Fill up registrationIds from select * from pushUsers
    sender.send(message, GLOBAL.pushRegistrationIds, 10, function (err, result) {
        if (err) {
            debug('GCM error', err);
        }
        else {
            debug('GCM result', result);
        }
    });
};
