var debug = require('debug')('util');
var exec = require('child_process').exec;
var domain = require('domain').create();

// play this if no votes
var DEFAULT_TUNE = 'mario.mp3';

/**
 * Search the global file list and find the tune with the most votes
 * @return {String} winningTune - the tune to play or the default when no winner
 */
exports.findWinner = function () {

    var winningTune;

    var highScore = 0;

    for (var tuneId in GLOBAL.files) {

        if (GLOBAL.files.hasOwnProperty(tuneId)) {

            var thisCount = GLOBAL.files[tuneId];

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

/**
 * Play the winning tune with afplay on the mac terminal
 * @deprecated
 * Handled by crontab directly
 */
exports.playTune = function () {

    var winningTune = findWinner();

    domain.run(function () {
        exec('afplay -t 15 -v 5 ./public/tunes/' + winningTune, function (error) {

            if (error) {
                debug('error playing', winningTune);
                throw error;
            }

            debug('played ' + winningTune + '!');

            // Reset vote count
            for (var key in GLOBAL.files) {
                GLOBAL.files[key] = 0;
            }

            // Tell every client to reset their vote counts to zero
            GLOBAL.io.sockets.emit('votes reset');

        });
    });

    domain.on('error', function (err) {
        debug(err);
        exec('say Oh, no! The mobile web jingle is broken.');
    });
};
