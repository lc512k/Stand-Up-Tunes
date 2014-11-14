var debug = require('debug')('util');
var exec = require('child_process').exec;
var fs = require('fs');
var domain = require('domain').create();

// play this if no votes
var DEFAULT_TUNE = 'mario_death.wav';

/**
 * Search the global file list and find the tune with the most votes
 * @return {String} todaysWinner - the tune to play or the default when no winner
 */
var findWinner = function () {

    var todaysWinner;

    var highScore = 0;

    for (var tuneId in GLOBAL.files) {

        if (GLOBAL.files.hasOwnProperty(tuneId)) {

            var thisCount = GLOBAL.files[tuneId].votes;

            if (thisCount > highScore) {
                highScore = thisCount;
                todaysWinner = tuneId;
            }
        }
    }

    // If no winner found, crown the default tune as the winner
    todaysWinner = todaysWinner || DEFAULT_TUNE;

    debug(todaysWinner);

    return todaysWinner;
};

/**
 * Save the current vote count to disk
 */
var saveVoteCount = exports.saveVoteCount = function () {
    domain.run(function () {
        fs.writeFile('backup.json', JSON.stringify(GLOBAL.files), function () {
            debug('Vote count saved!');
        });
    });
};

domain.on('error', function (e) {
    debug('error saving vote count', e);
});

/**
 * Play the winning tune with afplay on the mac terminal
 */
exports.playTune = function () {
    exec('afplay -v 10 ./public/tunes/' + findWinner(), function () {
        debug('played!');

        // Reset vote count
        for (var key in GLOBAL.files) {
            GLOBAL.files[key].votes = 0;
        }
        // Save to disk
        saveVoteCount();

        // Tell every client to reset their vote counts to zero
        GLOBAL.io.sockets.emit('votes reset');
    });
};

/**
 * Return true if array is empty or only has empty votes
 * @return {Boolean} is empty?
 */
exports.isEmptyVotes = function (voteArray) {

    if (!voteArray) {
        return true;
    }

    // It's not empty if we find at least one element with non-zero vote
    for (var tune in voteArray) {
        if (voteArray[tune].votes > 0) {
            return false;
        }
    }

    // All votes were zero. It's empty.
    return true;
};
