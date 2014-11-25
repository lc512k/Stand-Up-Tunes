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

/**
 * Save the current vote count to disk
 */
var saveVoteCount = function () {
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
 * Save the current user count to disk
 */
var saveUserCount = function () {
    domain.run(function () {
        fs.writeFile('users.json', JSON.stringify(GLOBAL.users), function () {
            debug('User count saved!');
        });
    });
};

/**
 * Save a snapshot of the current state to disk
 */
exports.saveCounts = function () {
    saveVoteCount();
    saveUserCount();
};

domain.on('error', function (e) {
    debug('error saving vote count', e);
});

/**
 * Play the winning tune with afplay on the mac terminal
 */
exports.playTune = function () {

    var winningTune = findWinner();

    exec('afplay -v 10 ./public/tunes/' + winningTune, function () {
        debug('played!');

        // Reset vote count
        for (var key in GLOBAL.files) {
            GLOBAL.files[key].votes = 0;
        }
        // Save to disk
        saveVoteCount();

        // Hand out prizes
        var winners = declareWinners(winningTune);

        // Top up votes for tomorrow
        topUp();

        // Say who won
        GLOBAL.io.sockets.emit('winners', winners);

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

/**
 * From all the users who connected today
 * find the ones who voted exactly once AND
 * voted for the winning tune
 * to give them an extra vote for tomorrow
 */
var declareWinners = function (winningTune) {

    var winners = {};

    for (var ip in GLOBAL.users) {

        var user = GLOBAL.users[ip];

        if (user.votesToday !== 1) {
            // Looser!
            continue;
        }

        if (user.votedFor === winningTune) {
            // Winner!
            user.votes++;
        }

        // Reset today's stuff
        user.votesToday = 0;
        user.votedFor = null;

        // Cache winner
        winners[ip] = user;
    }

    return winners;
};

var topUp = function () {

    for (var ip in GLOBAL.users) {
        GLOBAL.users[ip].votesLeft += 3;
    }
};
