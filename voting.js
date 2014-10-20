/* global files */

var debug = require('debug')('voting');

/**
 * [send description]
 * @param  {[type]} tuneId [description]
 * @param  {[type]} socket [description]
 * @return {[type]}        [description]
 */
exports.send = function (tuneId, socket) {
    // If this tune hasn't been voted on before, register it
    // with zero votes

    // Increase the vote count by one
    files[tuneId].votes++;

    // Update the client (voter) with the new vote
    socket.emit('new vote', {
        tuneId: tuneId,
        count: files[tuneId].votes
    });

    // Update the client (everyone else) with the new vote
    socket.broadcast.emit('new vote', {
        tuneId: tuneId,
        count: files[tuneId].votes
    });

    debug('tally', files);
};
