/* global votes */

var debug = require('debug')('voting');
var fs = require('fs');

/**
 * [init description]
 * @param  {[type]} files  [description]
 * @param  {[type]} socket [description]
 * @return {[type]}        [description]
 */
exports.init = function (files, socket) {
    debug('init');
    // Tell the client what tunes we have to vote on
    fs.readdir('tunes', function (err, files) {

        if (err) {
            // TODO emit it
            throw err;
        }

        // TODO filter out stuff that isn't music
        socket.emit('tunes list', {
            tuneIds: files
            //TODO url on the server http://123.234.23.2/bla/mario.mp3
        });
    });

    socket.emit('loading file list');
};

/**
 * [send description]
 * @param  {[type]} tuneId [description]
 * @param  {[type]} socket [description]
 * @return {[type]}        [description]
 */
exports.send = function (tuneId, socket) {
    // If this tune hasn't been voted on before, register it
    // with zero votes
    votes[tuneId] = votes[tuneId] || {
        count: 0
    };

    // Increase the vote count by one
    votes[tuneId].count++;

    // Update the client with the new vote
    socket.emit('new vote', {
        tuneId: tuneId,
        count: votes[tuneId].count
    });

    debug('tally', votes);
};
