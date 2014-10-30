var debug = require('debug')('timer');
var exec = require('child_process').exec;
var domain = require('domain').create();

// 9:40 am
var now = new Date();
var STANDUP_TIME = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 40, 0, 0);

var ONE_DAY = 1000 * 60 * 60 * 24;
var TEN_SEC = 1000 * 20;

// play this if no votes
var DEFAULT_TUNE = 'mario_death.wav';

/**
 * Play winning tune at STANDUP_TIME
 * Reset all counters and wait for tomorrow
 */
exports.init = function (io) {
    debug('init');

    var millisTillStandup = STANDUP_TIME - now;

    if (millisTillStandup < 0) {
        // Stand up time has passed
        // try again tomorrow
        millisTillStandup += ONE_DAY;
    }

    setInterval(function () {
        debug('Standup time!');

        // if playing a file failed, fallback to audio error message
        domain.on('error', function (err) {
            debug(err);
            exec('say Oh no! The mobile web jingle is broken.');
        });

        // Try to afplay the winning tune in the terminal
        domain.run(function () {

            function play (error) {

                if (error) {
                    throw error;
                }

                debug('Played! Resetting vote count');
                GLOBAL.resetVoteCount();

                // Tell every client to reset their vote counts to zero
                io.sockets.emit('votes reset');
            }

            // Play the tune!
            exec('afplay ./public/tunes/' + findWinner(), play);
        });

    }, millisTillStandup);
};

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
    return todaysWinner || DEFAULT_TUNE;
};
