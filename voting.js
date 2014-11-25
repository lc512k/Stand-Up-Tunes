var debug = require('debug')('voting');

exports.DEFAULT_VOTES = 3;

/**
 * When a new vote is received
 * find the tune in the global file list
 * and increase its vote count by one.
 * Tell all clients to update the vote count for this file
 */
exports.save = function (tuneId, socket) {

    // Increase the vote count by one
    GLOBAL.files[tuneId].votes++;

    // Update the client (voter) with the new vote
    socket.emit('new vote', {
        tuneId: tuneId,
        count: GLOBAL.files[tuneId].votes
        // TODO tell the owner how many votes left
    });

    // Update the client (everyone else) with the new vote
    socket.broadcast.emit('new vote', {
        tuneId: tuneId,
        count: GLOBAL.files[tuneId].votes
    });
};
