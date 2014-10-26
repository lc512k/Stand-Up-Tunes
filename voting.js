var debug = require('debug')('voting');

/**
 * [send description]
 * @param  {[type]} tuneId [description]
 * @param  {[type]} socket [description]
 * @return {[type]}        [description]
 */
exports.send = function (tuneId, socket) {

    // Increase the vote count by one
    GLOBAL.files[tuneId].votes++;

    // Update the client (voter) with the new vote
    socket.emit('new vote', {
        tuneId: tuneId,
        count: GLOBAL.files[tuneId].votes
    });

    // Update the client (everyone else) with the new vote
    socket.broadcast.emit('new vote', {
        tuneId: tuneId,
        count: GLOBAL.files[tuneId].votes
    });

    debug('tally', GLOBAL.files);
};
