/* global files */

var debug = require('debug')('timer');
var exec = require('child_process').exec;
var domain = require('domain').create();

/**
 * [init description]
 * @return {[type]} [description]
 */
exports.init = function () {
    debug('init');
    var now = new Date();
    var STANDUP_TIME = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 27, 30, 0);

    var millisTillStandup = STANDUP_TIME - now;

    if (millisTillStandup < 0) {
        // Stand up time has passed
        // try again tomorrow
        millisTillStandup += 60 * 60 * 1000 * 24;
    }

    // testing
    millisTillStandup = 10000;

    setTimeout(function () {
        debug('Standup time!');

        function findWinner() {
            var todaysWinner;

            var highScore = 0;

            for (var tuneId in files) {

                if (files.hasOwnProperty(tuneId)) {
                    var thisCount = files[tuneId].votes;

                    if (thisCount > highScore) {
                        highScore = thisCount;
                        todaysWinner = tuneId;
                    }
                }
            }
            return todaysWinner;
        }

        // if playing a file failed, fallback to audio error message
        domain.on('error', function (err) {
            debug(err);
            exec('say Oh no! The mobile web jingle is broken.');
        });

        // try/catch for executing afplay on the command line
        domain.run(function () {
            function play(error) {
                if (error) {
                    throw error;
                }
                debug('Played! Resetting vote count');
                GLOBAL.files = {};
            }
            exec('afplay ./public/tunes/' + findWinner(), play);
        });

    }, millisTillStandup);
};
