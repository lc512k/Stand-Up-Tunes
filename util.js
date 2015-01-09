var debug = require('debug')('util');
var exec = require('child_process').exec;
var fs = require('fs');
var domain = require('domain').create();

// play this if no votes
var DEFAULT_TUNE = 'mario_death.wav';

/**
 * Search the global file list and find the tune with the most votes
 * @return {String} winningTune - the tune to play or the default when no winner
 */
var findWinner = function () {

    var winningTune;

    var highScore = 0;

    for (var user in GLOBAL.tally) {

        if (GLOBAL.tally.hasOwnProperty(user)) {
            var tune = GLOBAL.tally[user];
            GLOBAL.files[tune].votes++;
        }
    }

    for (var tuneId in GLOBAL.files) {

        if (GLOBAL.files.hasOwnProperty(tuneId)) {

            var thisCount = GLOBAL.files[tuneId].votes;

            if (thisCount > highScore) {
                highScore = thisCount;
                winningTune = tuneId;
            }
        }
    }

    // If no winner found, crown the default tune as the winner
    winningTune = winningTune || DEFAULT_TUNE;

    debug(winningTune);

    return winningTune;
};

domain.on('error', function (e) {
    debug('error saving vote count', e);
});

/**
 * Save a snapshot of the current state to disk
 */
exports.saveCounts = function () {
    domain.run(function () {
        fs.writeFile('backup.json', JSON.stringify(GLOBAL.tally), function () {
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

    var winningTune = findWinner();

    domain.run(function () {
        exec('afplay -v 10 ./public/tunes/' + winningTune, function (error) {

            if (error) {
                throw error;
            }

            debug('played!');

            // Reset vote count
            for (var key in GLOBAL.files) {
                GLOBAL.files[key].votes = 0;
            }
            // Save to disk
            this.saveCounts();

            // Tell every client to reset their vote counts to zero
            GLOBAL.io.sockets.emit('votes reset');

        });
    });

    domain.on('error', function (err) {
        debug(err);
        exec('say Oh no! The mobile web jingle is broken.');
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

    debug('checking', voteArray);

    // It's not empty if we find at least one element with non-zero vote
    for (var tune in voteArray) {
        debug('checking', voteArray[tune]);
        if (voteArray[tune].votes > 0) {
            debug('not empty!');
            return false;
        }
    }

    // All votes were zero. It's empty.
    return true;
};
