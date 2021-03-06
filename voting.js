var debug = require('debug')('voting');
var util = require('./util');
var fs = require('fs');

var BASE_DIR = '/Users/laura/Stand-Up-Tunes/public/tunes/';
var SCRIPT_NAME = '/tmp/winner.sh';

/**
 * When a new vote is received
 * find the tune in the global file list
 * and increase its vote count by one.
 * Tell all clients to update the vote count for this file
 */
exports.save = function (tuneId, socket, cookie) {

    var previousTuneForClient = GLOBAL.tally[cookie];


    GLOBAL.tally[cookie] = tuneId;

    // Increase the vote count by one
    GLOBAL.files[tuneId]++;

    // Decrease the previous tune vote count
    if (previousTuneForClient) {
        GLOBAL.files[previousTuneForClient]--;
    }

    // TODO do in single emit
    // Update the client (voter) with the new vote
    socket.emit('new vote', {
        tuneId: tuneId,
        count: GLOBAL.files[tuneId]
    });

    // Update the client (everyone else) with the new vote
    socket.broadcast.emit('new vote', {
        tuneId: tuneId,
        count: GLOBAL.files[tuneId]
    });

    // Update the client (voter) with the new vote
    socket.emit('new vote', {
        tuneId: previousTuneForClient,
        count: GLOBAL.files[previousTuneForClient]
    });

    // Update the client (everyone else) with the new vote
    socket.broadcast.emit('new vote', {
        tuneId: previousTuneForClient,
        count: GLOBAL.files[previousTuneForClient]
    });

    // cronjob is:
    // 40 9 * * 1-5 /tmp/winner.sh
    fs.writeFile(SCRIPT_NAME, '#!/bin/sh\n/usr/bin/afplay ' + BASE_DIR + util.findWinner(), function (err) {
        if (err) {
            return console.log(err);
        }
        socket.emit('winner', util.findWinner());
        console.log('Cron script udpated!');
    });
};
