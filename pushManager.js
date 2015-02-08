var debug = require('debug')('push');
var gcm = require('node-gcm');

/**
 */
exports.subscribe = function (pushSubscription) {
    debug(pushSubscription);

    var message = new gcm.Message({
        collapseKey: 'demo',
        delayWhileIdle: true,
        timeToLive: 3,
        data: {
            key1: 'message1',
            key2: 'message2'
        }
    });

    var sender = new gcm.Sender('AIzaSyDURRSD3bpmMjBLiTKvr4CTCXkVOsOIioU');

    var registrationIds = [];
    registrationIds.push(pushSubscription.subscriptionId);

    setTimeout(function () {
        sender.send(message, registrationIds, 10, function (err, result) {
            if (err) {
                console.error('error', err);
            }
            else {
                console.log('message', message);
                console.log('result', result);
            }
        });
    }, 6000);
};
