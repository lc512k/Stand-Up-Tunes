/* global votes */

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
