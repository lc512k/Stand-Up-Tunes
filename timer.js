/* global votes */

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

    setTimeout(function () {
        debug('Standup time!');

        function findWinner() {
            var todaysWinner;

            var highScore = 0;

            for (var tuneId in votes) {

                if (votes.hasOwnProperty(tuneId)) {
                    var thisCount = votes[tuneId].count;

                    if (thisCount > highScore) {
                        highScore = thisCount;
                        todaysWinner = tuneId;
                    }
                }
            }
            return todaysWinner;
        }

        domain.on('error', function (err) {
            debug(err);
            exec('say The mobile web jingle is broken, but the standup is still on.');
        });

        domain.run(function () {
            function play(error) {
                if (error) {
                    throw error;
                }
                debug('played!');
            }
            exec('afplay ./tunes/' + findWinner(), play);
        });

    }, millisTillStandup);
};
